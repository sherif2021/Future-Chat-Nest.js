import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, ParseFilePipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { uid } from 'uid';

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

  @Post('search')
  @UseGuards(UserGuard)
  search(@UserJwt() userAuth: UserAuth, @Body('text') text: string){
    return this.userService.search(userAuth.userId, text);
  }
}
