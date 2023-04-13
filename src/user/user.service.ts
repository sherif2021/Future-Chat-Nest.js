import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { FIREBASE_ADMIN_INJECT, FirebaseAdminSDK } from '@tfarras/nestjs-firebase-admin';
import { Group } from 'src/chat/entities/group.entity';

@Injectable()
export class UserService {


  constructor(@InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) { }


  async getUser(userId: string): Promise<User> {

    const user = await this.userModel.findById(userId).select('-fcm -roles -unFollowUsers').exec();

    if (!user) throw new NotFoundException('This User Not Found');

    if (user.isBlock) throw new BadRequestException('Your Account has been Blocked.');

    return user;
  }

  async editUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {

    const user = await this.userModel.findOneAndUpdate({ _id: userId, isBlock: false }, updateUserDto, { returnOriginal: false }).select('-isBlock -fcm -roles -unFollowUsers').exec();

    if (!user) throw new BadRequestException('This Profile Not Exist.');

    return user;
  }

  async changePhone(userId: string, lagnuage: string, changePhoneDto: ChangePhoneDto): Promise<User> {

    try {

      const firebaseAuth = await this.firebaseAdmin.auth().verifyIdToken(changePhoneDto.idToken);

      if (firebaseAuth != null) {

        const existUser = await this.userModel.findOne({ phone: firebaseAuth.phone_number }).select('_id').exec();

        if (existUser) throw new BadRequestException(lagnuage == 'ar' ? 'رقم الهاتف الجديد موجود بالفعل' : 'The New Phone Number is Already Exist');

        const user = await this.userModel.findOneAndUpdate({ _id: userId, phone: changePhoneDto.oldPhone, isBlock: false }, { phone: firebaseAuth.phone_number, uid: firebaseAuth.uid }, { returnOriginal: false }).select('-fcm -roles');

        if (!user) throw new UnauthorizedException();

        return user;

      }
    }
    catch (e) {
      if (e instanceof BadRequestException || e instanceof UnauthorizedException) throw e;
      throw new InternalServerErrorException(lagnuage == 'ar' ? 'حدث خطأ ما' : 'there is an Error');
    }
  }

  async search(userId: string, text: string) {

    const data = await Promise.all([
      this.userModel
        .find({ _id: { $ne: userId }, $or: [{ firstName: { $regex: '.*' + text + '.*', $options: 'i' } }, { lastName: { $regex: '.*' + text + '.*', $options: 'i' } }] })
        .limit(20)
        .select('firstName lastName picture')
        .exec(),
      this.groupModel
        .find({ name: { $regex: '.*' + text + '.*', $options: 'i' } })
        .limit(20)
        .select('-members')
        .exec(),
    ])
    const users = data[0];
    const groups = data[1];

    return {
      'users': users,
      'groups': groups,
    }
  }


  unFollowUser(userId: string, targetId: string) {
    this.userModel.updateOne({ _id: userId }, { $addToSet: { unFollowUsers: targetId } }).exec();
  }

  getUserForChat(userId: string): Promise<User | undefined> {
    return this.userModel.findOne({ _id: userId, isBlock: false }).select('_id phone firstName lastName picture').exec();
  }
}