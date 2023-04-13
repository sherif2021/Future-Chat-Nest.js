import { Controller, Get, Post, Body, UseGuards,Headers } from '@nestjs/common';
import { PirvacyService } from './privacy.service';
import { UserJwt } from 'src/auth/common/user.decorato';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { UserAuth } from 'src/auth/common/user-auth';

@Controller('privacy')
export class PirvacyController {
  constructor(private readonly pirvacyService: PirvacyService) {}

  @Get('privacy-terms')
  getMazadCategory(@Headers('Language') language: string) {
    return this.pirvacyService.getPrivacyTerms(language);
  }
 
  @Post('contact-us')
  @UseGuards(UserGuard)
  contactUs(@UserJwt() userAuth: UserAuth, @Body('message') message: string){
    return this.pirvacyService.contactUs(userAuth.userId, message);
  }
}
