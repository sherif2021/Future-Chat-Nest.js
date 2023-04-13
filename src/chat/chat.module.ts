import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat-gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/common/constants';
import { ConfigModule } from '@nestjs/config';
import { PrivateMessage, PrivateMessageSchema } from './entities/private-message.entity';
import { Contact, ContactSchema } from './entities/contact.entity';
import { ReportSchema, Report } from 'src/report/entities/report.entity';
import { Group, GroupSchema } from './entities/group.entity';
import { GroupMessage, GroupMessageSchema } from './entities/group-message.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '365d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PrivateMessage.name, schema: PrivateMessageSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema },
    ]),
    NotificationModule,
  ]
})
export class ChatModule { }
