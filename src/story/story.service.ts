import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { Story } from './entities/story.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report } from 'src/report/entities/report.entity';
import { User } from 'src/user/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Injectable()
export class StoryService {

  constructor(@InjectModel(Story.name) private storyModel: Model<Story>,
    @InjectModel(User.name) private userModel: Model<User>,
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

  async getStoreis(userId: string, paginationQueryDto: PaginationQueryDto): Promise<Story[]> {

    const sotires = await this.storyModel.find({ user: userId })
      .sort({ 'createdAt': -1 })
      .skip(paginationQueryDto.offset)
      .limit(paginationQueryDto.limit)
      .select('-userViews')
      .populate('user', 'firstName lastName picture').exec();

    return this.getStoriesData(sotires, userId);
  }

  async viewStory(userId: string, storyId: string): Promise<Story> {
    const story = await this.storyModel.findOneAndUpdate({ _id: storyId }, { $addToSet: { userViews: userId } }, { returnOriginal: false })
      .select('-userViews')
      .populate('user', 'firstName lastName picture').exec();

    if (!story) throw new NotFoundException('This Story Not Found.');

    return (await this.getStoriesData([story], userId))[0];

  }

  private async getStoriesData(stories: Story[], userId?: string,): Promise<Story[]> {

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
    return stories;
  }

  // when story deleted send notification to user
  // @Cron('0 1 * * * *')
  // handleCron() {
  //   console.log('Called every 30 seconds');
  // }
}
