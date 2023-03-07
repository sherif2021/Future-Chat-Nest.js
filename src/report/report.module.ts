import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/post/entities/post.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Comment, CommentSchema } from 'src/comment/entities/comment.entity';
import { Report, ReportSchema } from './entities/report.entity';

@Module({
  controllers: [ReportController],
  providers: [ReportService],
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema }
    ]),
  ]
})
export class ReportModule {}
