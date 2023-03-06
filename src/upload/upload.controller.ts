import { Controller, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { uid } from 'uid';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }


  @Post('file')
  @UseGuards(UserGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/files',
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
          // new FileTypeValidator({ fileType: RegExp('jpeg||jpg||png') }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): string {

    return file.path.replace('public/', '');
  }


  // @Post('files')
  // @UseGuards(UserGuard)
  // @UseInterceptors(
  //   FileInterceptor('files', {
  //     storage: diskStorage({
  //       destination: './public/files',
  //       filename(req, file, callback) {

  //         const originalameSplit = file.originalname.split('.');

  //         callback(null, `${uid(40)}.${originalameSplit.at(originalameSplit.length - 1)}`);
  //       },
  //     }),
  //   },
  //   ),
  // )
  // uploadFiles(
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       validators: [
  //         new MaxFileSizeValidator({ maxSize: 10000000 }),
  //         //new FileTypeValidator({ fileType: RegExp('jpeg||jpg||png') }),
  //       ],
  //     }),
  //   )
  //   files: Array<Express.Multer.File>,
  // ): string[] {

  //   return files.map(e => e.path.replace('public/', ''));
  // }

}
