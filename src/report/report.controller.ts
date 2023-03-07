import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Post("user")
  @UseGuards(UserGuard)
  reportUser(@UserJwt() userAuth: UserAuth, @Body("userId") userId: string) {
    return this.reportService.reportUser(userId, userAuth.userId);
  }

  @Post("post")
  @UseGuards(UserGuard)
  reportPost(@UserJwt() userAuth: UserAuth, @Body("postId") postId: string) {
    return this.reportService.reportPost(postId, userAuth.userId);
  }

  @Post("comment")
  @UseGuards(UserGuard)
  reportCommentOrReplay(@UserJwt() userAuth: UserAuth, @Body("targetId") targetId: string) {
    return this.reportService.reportCommentOrRepaly(targetId, userAuth.userId);
  }
}
