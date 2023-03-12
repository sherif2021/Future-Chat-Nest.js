import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChatService {

    constructor(@InjectModel(User.name) private userModel: Model<User>) { }


    async getUserById(id: string) : Promise<User | undefined>{

        return this.userModel.findOne({_id: id, isBlock : false}).select('firstName lastName picture').exec();
      }
}
