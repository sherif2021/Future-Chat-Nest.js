import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactUs } from './entities/contact-us.entity';
import { Privacy } from './entities/privacy.entity';

@Injectable()
export class PirvacyService {

  constructor(
    @InjectModel(Privacy.name) private privacyModel: Model<Privacy>,
    @InjectModel(ContactUs.name) private contactUsModel: Model<ContactUs>
  ) { }

  async getPrivacyTerms( language : string) : Promise<Privacy> {

    const result = await this.privacyModel.findOne().select(language == 'ar' ? '-privacyEn -termsEn' : '-privacyAr -termsAr').exec();

    if (!result){
      const object = new this.privacyModel({});
      await object.save();
      return this.getPrivacyTerms(language);
    }
    return result;
  }

  async contactUs(userId: String, message: string) {

    const object = new this.contactUsModel({ user: userId, message });

    await object.save();
  }
}
