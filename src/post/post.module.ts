import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema, Post } from './entities/post.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { PostShare, PostShareSchema } from './entities/share-post.entity';
import { Contact, ContactSchema } from 'src/chat/entities/contact.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: PostShare.name, schema: PostShareSchema },
      { name: Contact.name, schema: ContactSchema }
    ]),
    NotificationModule,
  ]
})
export class PostModule { }
