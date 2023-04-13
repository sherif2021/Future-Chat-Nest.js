import { Body, Controller, Get, Patch, Post, UseGuards, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { bool } from 'joi';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @UseGuards(UserGuard)
  getUser(@UserJwt() userAuth: UserAuth): Promise<User> {
    return this.userService.getUser(userAuth.userId);
  }

  @Patch()
  @UseGuards(UserGuard)
  editUser(@UserJwt() userAuth: UserAuth, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.editUser(userAuth.userId, updateUserDto);
  }

  @Patch('change-phone')
  @UseGuards(UserGuard)
  changePhone(@UserJwt() userAuth: UserAuth, @Headers('Language') language: string, @Body() changePhoneDto: ChangePhoneDto): Promise<User> {
    return this.userService.changePhone(userAuth.userId, language, changePhoneDto);
  }

  @Post('search')
  @UseGuards(UserGuard)
  search(@UserJwt() userAuth: UserAuth, @Body('text') text: string) {
    return this.userService.search(userAuth.userId, text);
  }


  @Post('un-follow')
  @UseGuards(UserGuard)
  unFollow(@UserJwt() userAuth: UserAuth, @Body('userId') userId: string) {
    return this.userService.unFollowUser(userAuth.userId, userId);
  }


}
