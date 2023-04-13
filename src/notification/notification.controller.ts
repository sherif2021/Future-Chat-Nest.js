import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }


  @Get('')
  @UseGuards(UserGuard)
  getNotifications(@UserJwt() userAuth: UserAuth, @Query() paginationQueryDto: PaginationQueryDto) {
    return this.notificationService.getNotifications(userAuth.userId, paginationQueryDto);
  }

  @Post('set-all-read')
  @UseGuards(UserGuard)
  setAllRead(@UserJwt() userAuth: UserAuth) {
    return this.notificationService.setAllRead(userAuth.userId);
  }

  @Post('set-read')
  @UseGuards(UserGuard)
  setRead(@UserJwt() userAuth: UserAuth, @Body('id') notificationId: string) {
    return this.notificationService.setRead(userAuth.userId, notificationId);
  }
}
