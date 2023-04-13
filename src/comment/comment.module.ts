import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/post/entities/post.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Comment, CommentSchema } from './entities/comment.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema }
    ]),
    NotificationModule,
  ]
})
export class CommentModule { }
