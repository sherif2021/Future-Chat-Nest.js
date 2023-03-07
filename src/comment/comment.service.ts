import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { CreateReplayDto } from './dto/create-replay.dto';

@Injectable()
export class CommentService {

  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>
  ) { }

  async createComment(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {

    const data = await Promise.all([
      this.postModel.findById(createCommentDto.postId).select('_id').exec(),
      this.userModel.findOne({ _id: userId, isBlock: false }).select('firstName lastName picture').exec()
    ])


    const post = data[0];
    const user = data[1];

    if (!post) throw new NotFoundException('This Post Not Found.');
    if (!user) throw new NotFoundException('This User Not Found.');


    const commentObject = new this.commentModel({ parentId: createCommentDto.postId, text: createCommentDto.text, user: userId, isReplay: false });

    const comment = await commentObject.save();
    comment.user = user;
    comment.isLiked = false;
    comment.likes = 0;

    const commentCounts = await this.calculatePostComments(createCommentDto.postId);
   // comment.
    return comment;
  }

  async createReplay(userId: string, createReplayDto: CreateReplayDto): Promise<Comment> {

    const data = await Promise.all([
      this.commentModel.findOne({ _id: createReplayDto.commentId, isReplay: false }).select('_id').exec(),
      this.userModel.findOne({ _id: userId, isBlock: false }).select('firstName lastName picture').exec()
    ])


    const parentComment = data[0];
    const user = data[1];

    if (!parentComment) throw new NotFoundException('This Comment Not Found.');
    if (!user) throw new NotFoundException('This User Not Found.');


    const commentObject = new this.commentModel({ parentId: createReplayDto.commentId, text: createReplayDto.text, user: userId, isReplay: true });

    const comment = await commentObject.save();
    comment.user = user;
    comment.isLiked = false;

    this.calculateCommentReplies(createReplayDto.commentId);
    return comment;
  }

  async editComment(userId: string, commentId: string, text: string): Promise<Comment> {

    const comment = await this.commentModel.findOne({ _id: commentId, user: userId }, { text }, { returnOriginal: false }).select('-userLikes').populate('user', 'firstName lastName picture').exec();

    if (!comment) throw new NotFoundException('This Comment Not Found.');

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {

    const comment = await this.commentModel.findOneAndDelete({ _id: commentId, user: userId }).select('_id').exec();

    if (!comment) throw new NotFoundException('This Comment Not Found.');
    this.commentModel.deleteMany({ parentId: commentId, isReplay: true }).exec();
  }

  async getPostComments(postId: string, userId: string, paginationQueryDto: PaginationQueryDto): Promise<Comment[]> {
    const comments = await this.commentModel.find({ parentId: postId, isReplay: false })
      .sort({ 'createdAt': -1 })
      .skip(paginationQueryDto.offset)
      .limit(paginationQueryDto.limit)
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();

    return this.getCommentsData(comments, userId);
  }

  async likeCommentOrReplay(userId: string, targetId: string): Promise<Comment> {
    const comment = await this.commentModel.findOneAndUpdate({ _id: targetId }, { $addToSet: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!comment) throw new NotFoundException('This Comment Or Replay Not Found.');

    // send notication to post owner

    return (await this.getCommentsData([comment], userId))[0];

  }

  async unLikeCommentOrReplay(userId: string, targetId: string): Promise<Comment> {
    const comment = await this.commentModel.findOneAndUpdate({ _id: targetId }, { $pull: { userLikes: userId } }, { returnOriginal: false })
      .select('-userLikes')
      .populate('user', 'firstName lastName picture').exec();


    if (!comment) throw new NotFoundException('This Comment Or Replay Not Found.');

    return (await this.getCommentsData([comment], userId))[0];

  }

  private async calculatePostComments(postId: string): Promise<number> {

    const count = await this.commentModel.find({ parentId: postId, isReplay: false }).count();
    this.postModel.updateOne({ _id: postId }, { comments: count }).exec();

    return count;
  }


  private async calculateCommentReplies(commentId: string): Promise<number> {

    const count = await this.commentModel.find({ parentId: commentId, isReplay: true }).count();
    this.commentModel.updateOne({ _id: commentId }, { comments: count }).exec();

    return count;
  }

  private async getCommentsData(comments: Comment[], userId?: string,): Promise<Comment[]> {

    if (comments.length > 0) {
      const postsData = await this.commentModel.aggregate([
        { $match: { _id: { $in: comments.map(e => new mongoose.Types.ObjectId(e.id)) } } }, {
          $project: {
            likes: { $size: '$userLikes' },
            isLiked: userId != null ? { $in: [userId, '$userLikes'] } : false,
          },
        }])

      for (const comment of comments) {
        for (const postData of postsData) {
          if (comment.id == postData._id) {
            comment.likes = postData.likes;
            comment.isLiked = postData.isLiked;
            break;
          }
        }
      }
    }
    return comments;
  }
}