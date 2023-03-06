import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, ParseFilePipe, Patch, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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

  @Patch('picture')
  @UseGuards(UserGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/pictures',
        filename(req, file, callback) {

          const originalameSplit = file.originalname.split('.');

          callback(null, `${uid(40)}.${originalameSplit.at(originalameSplit.length - 1)}`);
        },
      }),
    }),
  )
  uploadFile(
    @UserJwt() userAuth: UserAuth,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          new FileTypeValidator({ fileType: RegExp('jpeg||jpg||png') }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<User> {

    return this.userService.editUser(userAuth.userId, { picture: file.path.replace('public/', '') });
  }
}
