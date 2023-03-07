import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {


  constructor(@InjectModel(User.name) private userModel: Model<User>) { }


  async getUser(userId: string): Promise<User> {

    const user = await this.userModel.findById(userId).select('-fcm -roles').exec();

    console.log(userId);

    if (!user) throw new NotFoundException('This User Not Found');

    if (user.isBlock) throw new BadRequestException('Your Account has been Blocked.');

    return user;
  }

  async editUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {

    const user = await this.userModel.findOneAndUpdate({ _id: userId, isBlock: false }, updateUserDto, { returnOriginal: false }).select('-isBlock -fcm -roles').exec();

    if (!user) throw new BadRequestException('This Profile Not Exist.');

    return user;
  }

  async search(userId: string, text: string) {

    const users = await this.userModel
      .find({ _id: { $ne: userId }, $or: [{ firstName: { $regex: '.*' + text + '.*', $options: 'i' } }, { lastName: { $regex: '.*' + text + '.*', $options: 'i' } }] })
      .limit(20)
      .select('firstName lastName picture')
      .exec();

    return {
      'users': users,
      'groups': [],
    }
  }
}