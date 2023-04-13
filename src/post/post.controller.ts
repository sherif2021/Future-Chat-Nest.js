import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post()
  @UseGuards(UserGuard)
  createPost(@UserJwt() userAuth: UserAuth, @Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(userAuth.userId, createPostDto);
  }

  @Patch(':id')
  @UseGuards(UserGuard)
  editPost(@Param('id') postId: string, @UserJwt() userAuth: UserAuth, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.editPost(postId, userAuth.userId, updatePostDto);
  }
  
  @Delete(':id')
  @UseGuards(UserGuard)
  async deletePost(@Param('id') postId: string, @UserJwt() userAuth: UserAuth) {
    await this.postService.deletePost(postId, userAuth.userId);
  }


  @Get(':id')
  @UseGuards(UserGuard)
  getPost(@UserJwt() userAuth: UserAuth, @Param('id') postId: string) {
    return this.postService.getPost(userAuth.userId, postId);
  }

  @Get()
  @UseGuards(UserGuard)
  getUserPosts(@UserJwt() userAuth: UserAuth, @Query() paginationQueryDto: PaginationQueryDto) {
    return this.postService.getUserPosts(userAuth.userId, paginationQueryDto);
  }

  @Post('like')
  @UseGuards(UserGuard)
  likePost(@UserJwt() userAuth: UserAuth, @Body("postId") postId: string) {
    return this.postService.likePost(userAuth.userId, postId);
  }

  @Post('unlike')
  @UseGuards(UserGuard)
  unLikePost(@UserJwt() userAuth: UserAuth, @Body("postId") postId: string) {
    return this.postService.unLikePost(userAuth.userId, postId);
  }

  @Post('share')
  @UseGuards(UserGuard)
  sharePost(@UserJwt() userAuth: UserAuth, @Body("postId") postId: string) {
    return this.postService.sharePost(userAuth.userId, postId);
  }
}
