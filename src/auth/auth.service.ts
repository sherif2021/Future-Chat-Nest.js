import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { FIREBASE_ADMIN_INJECT, FirebaseAdminSDK } from '@tfarras/nestjs-firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {


    constructor(
        private readonly jwtService: JwtService,
        @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
        @InjectModel(User.name) private userModel: Model<User>,

    ) { }


    async login(loginDto: LoginDto): Promise<Object> {

        var isBlocked = false;

        try {
            const firebaseAuth = await this.firebaseAdmin.auth().verifyIdToken(loginDto.idToken);

            if (firebaseAuth != null) {

                const user = await this.userModel.findOne({ phone: firebaseAuth.phone_number, uid: firebaseAuth.uid }).select('isBlock');

                if (user.isBlock) {
                    isBlocked = true;
                }
                else {
                    if (loginDto.fcm)
                        this.userModel.updateOne({ _id: user.id }, { $addToSet: { fcm: loginDto.fcm } }).exec();

                    if (loginDto.language)
                        this.userModel.updateOne({ _id: user.id }, { language: loginDto.language }).exec();

                    const payload = { userId: user.id, roles: user.roles };

                    return {
                        accessToken: this.jwtService.sign(payload),
                    };
                }
            }
        }
        catch (e) { }

        if (isBlocked) throw new BadRequestException('Your Account has been Blocked.');
        else
            throw new ConflictException('There is an Error while Register, Please try agian.');
    }

    async register(registerDto: RegisterDto): Promise<Object> {

        var isPhoneExist = false;

        try {
            const firebaseAuth = await this.firebaseAdmin.auth().verifyIdToken(registerDto.idToken);

            if (firebaseAuth != null) {

                const existUser = await this.userModel.findOne({ phone: firebaseAuth.phone_number }).select('_id');

                if (existUser) { isPhoneExist = true; }

                else {
                    const userObject = new this.userModel({ ...registerDto, phone: firebaseAuth.phone_number, uid: firebaseAuth.uid });

                    const user = await userObject.save();

                    const payload = { userId: user.id, roles: [] };

                    return {
                        accessToken: this.jwtService.sign(payload),
                    };
                }
            }
        }

        catch (e) { }

        if (isPhoneExist) throw new BadRequestException('This Phone is already Exist.');
        else throw new ConflictException('There is an Error while Register, Please try agian.');

    }

    async checkPhone(phone: string): Promise<any> {
        const user = await this.userModel.findOne({ phone }).select('_id').exec();
        return { exist: user != null };
    }
}
