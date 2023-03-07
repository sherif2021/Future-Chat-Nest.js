import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Post } from 'src/post/entities/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Report } from './entities/report.entity';
import { ReportTypes } from 'src/common/report-types';
import { Comment } from 'src/comment/entities/comment.entity';

@Injectable()
export class ReportService {


  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) { }


  async reportUser(userId: string, reportingUserId: string) {

    const data = await Promise.all([
      this.userModel.findById(userId).select('_id').exec(),
      this.userModel.findById(reportingUserId).select('_id').exec()
    ]);

    const user = data[0];
    const reportingUser = data[1];

    if (!user) throw new NotFoundException('This User Not Found.');

    if (!reportingUser) throw new UnauthorizedException('Your User Not Found.');

    const reportObject = new this.reportModel({ user: reportingUserId, contentId: userId, type: ReportTypes.user });
    reportObject.save();
  }

  async reportPost(postId: string, reportingUserId: string) {

    const data = await Promise.all([
      this.postModel.findById(postId).select('_id'),
      this.userModel.findById(reportingUserId).select('_id')
    ]);

    const post = data[0];
    const reportingUser = data[1];

    if (!post) throw new NotFoundException('This Post Not Found.');

    if (!reportingUser) throw new UnauthorizedException('Your User Not Found.');

    const reportObject = new this.reportModel({ user: reportingUserId, contentId: postId, type: ReportTypes.post });
    reportObject.save();
  }

  async reportCommentOrRepaly(targetId: string, reportingUserId: string) {

    const data = await Promise.all([
      this.commentModel.findById(targetId).select('isRepaly'),
      this.userModel.findById(reportingUserId).select('_id')
    ]);

    const comment = data[0];
    const reportingUser = data[1];

    if (!comment) throw new NotFoundException('This Commnet Or Replay Not Found.');

    if (!reportingUser) throw new UnauthorizedException('Your User Not Found.');

    const reportObject = new this.reportModel({ user: reportingUserId, contentId: targetId, type: comment.isReplay ? ReportTypes.replay : ReportTypes.comment });
    reportObject.save();
  }
}
