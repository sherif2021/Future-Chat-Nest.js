import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';

@Injectable()
export class UserService {


  constructor(@InjectModel(User.name) private userModel: Model<User>) { }


  async getUser(userId: string): Promise<User> {

    const user = await this.userModel.findById(userId).select('-isBlock -fcm -roles').exec();

    if (user.isBlock) throw new BadRequestException('Your Account has been Blocked.');

    return user;
  }

  async editUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {

    const user = await this.userModel.findOneAndUpdate({ _id: userId, isBlock: false }, updateUserDto, { returnOriginal: false }).select('-isBlock -fcm -roles').exec();

    if (!user) throw new BadRequestException('This Profile Not Exist.');

    return user;
  }

  async test() {
    try {
      const users = await this.userModel.find();
      const writeFile = promisify(fs.writeFile);


      writeFile(`${join(__dirname, '..', 'public')}/users.json`, JSON.stringify(users), 'utf8');
    } catch (e) {
      console.log(e);
    }
  }
}
