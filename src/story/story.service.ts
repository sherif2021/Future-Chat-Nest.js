import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { Story } from './entities/story.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report } from 'src/report/entities/report.entity';
import { User } from 'src/user/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { Contact } from 'src/chat/entities/contact.entity';

@Injectable()
export class StoryService {

  constructor(@InjectModel(Story.name) private storyModel: Model<Story>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
  ) { }

  async createStory(userId: string, createStoryDto: CreateStoryDto): Promise<Story> {

    if (createStoryDto.text == null && createStoryDto.picture == null && createStoryDto.video == null)
      throw new BadRequestException('The story must have at least one element.');

    const user = await this.userModel.findById(userId).select('firstName lastName picture').exec();

    if (!user) throw new UnauthorizedException('Your User Not Found.');

    const storyObject = new this.storyModel({ ...createStoryDto, user: userId });

    const story = await storyObject.save();

    story.user = user;

    return story;
    // send notiftcaion to user contactss
  }

  async deleteStory(userId: string, storyId: string) {

    const story = await this.storyModel.findOneAndDelete({ _id: storyId, user: userId }).select('_id').exec();

    if (!story) throw new NotFoundException('This Story Not Found.');
  }

  async getStoreis(userId: string, paginationQueryDto: PaginationQueryDto): Promise<User[]> {

    const userData = await Promise.all([
      this.userModel.findOne({ _id: userId, isBlock: false }).select('unFollowUsers').exec(),
      this.contactModel.find({ ownerId: userId, isGroup: false }).distinct('contentId'),
    ]);

    const user = userData[0];
    const contacts = userData[1];

    if (!user) return [];

    const concatdIds: mongoose.Types.ObjectId[] = contacts.filter(e => !user.unFollowUsers.includes(e)).map(e=> new mongoose.Types.ObjectId(e));

    concatdIds.push(new mongoose.Types.ObjectId(userId));

    const userStoreis = await this.storyModel.aggregate(
      [
        { '$match': { user: { $in: concatdIds} } },
        { "$group": { "_id": "$user" } },
        { "$skip": paginationQueryDto.offset },
        { "$limit": paginationQueryDto.limit }
      ]
    ).exec();

    if (userStoreis.length == 0) return [];

    const data = await Promise.all([
      this.userModel.find({ _id: { $in: userStoreis.map(e => e._id) } }).select('firstName lastName picture').exec(),
      this.storyModel.find({ user: { $in: userStoreis.map(e => e._id) } }).sort({ 'createdAt': -1 }).select('-userViews').exec(),
    ]);

    const users = data[0];
    const stories = data[1];

    await this.getStoriesData(stories, userId);

    for (const user of users) {
      const allUserStories: Story[] = [];

      for (const story of stories) {
        if (story.user == user.id) {
          allUserStories.push(story);
        }
      }
      user.stories = allUserStories;

    }
    return users;
  }

  async viewStory(userId: string, storyId: string): Promise<Story> {
    const story = await this.storyModel.findOneAndUpdate({ _id: storyId }, { $addToSet: { userViews: userId } }, { returnOriginal: false })
      .select('-userViews')
      .populate('user', 'firstName lastName picture').exec();

    if (!story) throw new NotFoundException('This Story Not Found.');

    await this.getStoriesData([story], userId);

    return story;

  }

  private async getStoriesData(stories: Story[], userId?: string,) {

    if (stories.length > 0) {
      const storiesData = await this.storyModel.aggregate([
        { $match: { _id: { $in: stories.map(e => new mongoose.Types.ObjectId(e.id)) } } }, {
          $project: {
            views: { $size: '$userViews' },
            isViewed: userId != null ? { $in: [userId, '$userViews'] } : false,
          },
        }])

      for (const story of stories) {
        for (const storyData of storiesData) {
          if (story.id == storyData._id) {
            story.views = storyData.views;
            story.isViewed = storyData.isViewed;
            break;
          }
        }
      }
    }
  }

  // when story deleted send notification to user
  // @Cron('0 1 * * * *')
  // handleCron() {
  //   console.log('Called every 30 seconds');
  // }
}
