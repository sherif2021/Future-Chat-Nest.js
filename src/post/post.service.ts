import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { PostShare } from './entities/share-post.entity';
import { Contact } from 'src/chat/entities/contact.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationTypes } from 'src/common/notification-types';

@Injectable()
export class PostService {

  constructor(
    private notificationService: NotificationService,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    @InjectModel(PostShare.name) private postShareModel: Model<PostShare>,
  ) { }

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {

    const user = await this.userModel.findOne({ _id: userId, isBlock: false }).select('firstName lastName picture');

    if (!user) throw new NotFoundException('This User Not Found.');

    createPostDto.user = userId;

    const postObject = new this.postModel(createPostDto);

    const post = await postObject.save();
    post.user = user;
    post.isLiked = false;
    post.likes = 0;


    this.contactModel.find({ ownerId: userId, isGroup: false }).then(users => {
      for (const user of users) {
        this.notificationService.sendNotifcation(
          user.contentId,
          NotificationTypes.newPost,
          post.id,
          userId,
        );
      }
    })
    return post;
  }

  async editPost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {

    const post = await this.postModel.findOneAndUpdate({ _id: postId, user: userId }, updatePostDto, { returnOriginal: false }).select('-userLikes').populate('user', 'firstName lastName picture').exec();

    if (!post) throw new NotFoundException('This Post Not Found.');

    return (await this.getPostsData([post], userId))[0];
  }

  async deletePost(postId: string, userId: string) {

    const post = await this.postModel.findOneAndDelete({ _id: postId, user: userId }).select('_id')

    if (!post) throw new NotFoundException('This Post Not Found.');

  }

  async getUserPosts(userId: string, paginationQueryDto: PaginationQueryDto): Promise<Post[]> {

    const userData = await Promise.all([
      this.userModel.findOne({ _id: userId, isBlock: false }).select('unFollowUsers').exec(),
      this.contactModel.find({ ownerId: userId, isGroup: false }).distinct('contentId'),
    ]);

    const user = userData[0];
    const contacts = userData[1];

    if (!user) return [];

    const concatdIds: mongoose.Types.ObjectId[] = contacts.filter(e => !user.unFollowUsers.includes(e)).map(e => new mongoose.Types.ObjectId(e));

    concatdIds.push(new mongoose.Types.ObjectId(userId));

    const posts = await this.postModel.find({
      user: { $in: concatdIds }
    })
      .sort({ 'createdAt': -1 })
      .skip(paginationQueryDto.offset)
      .limit(paginationQueryDto.limit)
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();

    return this.getPostsData(posts, userId);
  }


  async getPost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findById(postId)
      .sort({ 'createdAt': -1 })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();

    if (!post) throw new NotFoundException('This Post Not Found');
    return (await this.getPostsData([post], userId))[0];
  }

  async likePost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findOneAndUpdate({ _id: postId }, { $addToSet: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!post) throw new NotFoundException('This Post Not Found.');

    // send notication to post owner

    if (userId != post.user.id) {
      this.notificationService.sendNotifcation(
        post.user.id,
        NotificationTypes.likePost,
        post.id,
        userId,
      )
    }
    return (await this.getPostsData([post], userId))[0];

  }

  async unLikePost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findOneAndUpdate({ _id: postId }, { $pull: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!post) throw new NotFoundException('This Post Not Found.');

    return (await this.getPostsData([post], userId))[0];

  }

  async sharePost(userId: string, postId: string): Promise<Post> {

    const post = await this.postModel.findById(postId).select('-userLikes').populate('user', 'firstName lastName picture').exec();

    if (!post) throw new NotFoundException('This Post Not Found.');

    await this.postShareModel.updateOne(
      { userId, postId },
      { userId, postId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    const shares = await this.calculatePostShares(postId);
    post.shares = shares;


    if (userId != post.user.id) {
      this.notificationService.sendNotifcation(
        post.user.id,
        NotificationTypes.sharePost,
        post.id,
        userId,
      )
    }

    // send notifcation
    return post;
  }

  private async getPostsData(posts: Post[], userId?: string,): Promise<Post[]> {

    if (posts.length > 0) {
      const postsData = await this.postModel.aggregate([
        { $match: { _id: { $in: posts.map(e => new mongoose.Types.ObjectId(e.id)) } } }, {
          $project: {
            likes: { $size: '$userLikes' },
            isLiked: userId != null ? { $in: [userId, '$userLikes'] } : false,
          },
        }])

      for (const post of posts) {
        for (const postData of postsData) {
          if (post.id == postData._id) {
            post.likes = postData.likes;
            post.isLiked = postData.isLiked;
            break;
          }
        }
      }
    }
    return posts;
  }

  private async calculatePostShares(postId: string): Promise<number> {

    const count = await this.postShareModel.find({ postId }).count();
    this.postModel.updateOne({ _id: postId }, { shares: count }).exec();

    return count;
  }
}
