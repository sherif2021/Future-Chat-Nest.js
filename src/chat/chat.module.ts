import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat-gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/common/constants';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '365d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ]
})
export class ChatModule { }
