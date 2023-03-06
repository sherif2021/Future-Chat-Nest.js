import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Injectable()
export class PostService {

  constructor(@InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>
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
    const posts = await this.postModel.find({ user: userId, type: 1 })
      .sort({ 'createdAt': -1 })
      .skip(paginationQueryDto.offset)
      .limit(paginationQueryDto.limit)
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();

    return this.getPostsData(posts, userId);
  }

  async likePost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findOneAndUpdate({ _id: postId }, { $addToSet: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!post) throw new NotFoundException('This Post Not Found.');

    // send notication to post owner
    
    return (await this.getPostsData([post], userId))[0];

  }

  async unLikePost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findOneAndUpdate({ _id: postId }, { $pull: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!post) throw new NotFoundException('This Post Not Found.');

    return (await this.getPostsData([post], userId))[0];

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
}
