import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @Post()
  @UseGuards(UserGuard)
  createComment(@UserJwt() userAuth: UserAuth, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(userAuth.userId, createCommentDto);
  }

  @Post('replay')
  @UseGuards(UserGuard)
  createReplay(@UserJwt() userAuth: UserAuth, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(userAuth.userId, createCommentDto);
  }



  @Get(':id')
  @UseGuards(UserGuard)
  getPostComment(@Param('id') postId: string, @UserJwt() userAuth: UserAuth, @Query() paginationQueryDto: PaginationQueryDto) {
    return this.commentService.getPostComments(postId, userAuth.userId, paginationQueryDto);
  }

  @Patch(':id')
  @UseGuards(UserGuard)
  editComment(@Param('id') commentId: string, @Body('text') text: string, @UserJwt() userAuth: UserAuth,) {
    return this.commentService.editComment(userAuth.userId, commentId, text);
  }

  @Delete(':id')
  @UseGuards(UserGuard)
  deleteComment(@Param('id') commentId: string, @UserJwt() userAuth: UserAuth,) {
    return this.commentService.deleteComment(userAuth.userId, commentId);
  }


  @Post('like')
  @UseGuards(UserGuard)
  likeCommentOrReplay(@UserJwt() userAuth: UserAuth, @Body("targetId") targetId: string) {
    return this.commentService.likeCommentOrReplay(userAuth.userId, targetId);
  }

  @Post('unlike')
  @UseGuards(UserGuard)
  unLikeCommentOrReplay(@UserJwt() userAuth: UserAuth, @Body("targetId") targetId: string) {
    return this.commentService.unLikeCommentOrReplay(userAuth.userId, targetId);
  }
}
