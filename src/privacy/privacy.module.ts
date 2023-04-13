import { Module } from '@nestjs/common';
import { PirvacyService } from './privacy.service';
import { PirvacyController } from './privacy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactUs, ContactUsSchema } from './entities/contact-us.entity';
import { Privacy, PrivacySchema } from './entities/privacy.entity';

@Module({
  controllers: [PirvacyController],
  imports: [
    MongooseModule.forFeature([
      { name: Privacy.name, schema: PrivacySchema },
      { name: ContactUs.name, schema: ContactUsSchema }
    ]),
  ], 
  providers: [PirvacyService]
})
export class PirvacyModule {}
