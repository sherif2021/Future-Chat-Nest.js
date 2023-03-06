import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema, Post } from './entities/post.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports:[
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema }
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ]
})
export class PostModule {}
