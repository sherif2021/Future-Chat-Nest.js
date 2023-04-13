import { Body, Controller, Post, UseGuards, Headers, Get, Param, Query, Delete, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserGuard } from 'src/auth/gurards/user.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { UserAuth } from 'src/auth/common/user-auth';
import { UserJwt } from 'src/auth/common/user.decorato';
import { PrivateMessage } from './entities/private-message.entity';
import { ChatGateway } from './chat-gateway';
import { Contact } from './entities/contact.entity';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMessage } from './entities/group-message.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway) { }


  @Post('send-private-message')
  @UseGuards(UserGuard)
  async sendPrivateMessage(@UserJwt() userAuth: UserAuth, @Headers('Language') language: string, @Body() sendMessageDto: SendMessageDto) {
    const message = await this.chatService.sendPrivateMessage(userAuth.userId, language, sendMessageDto);
    if (!message.isBlock) {
      const isOnline = await this.chatGateway.isUserOnline(message.receiverId);
      if (isOnline) {
        message.sentDate = new Date();
        this.chatGateway.sendPrivateMessage(message, message.receiverId);
        this.chatService.setPrivateMessagesIsSent([message.id]);
      } else {
        this.chatService.sendPrivateMessageNotification(message);
      }
    }
    this.chatGateway.sendPrivateMessage(message, userAuth.userId);

  }


  @Post('send-group-message')
  @UseGuards(UserGuard)
  async sendGroupMessage(@UserJwt() userAuth: UserAuth, @Headers('Language') language: string, @Body() sendMessageDto: SendMessageDto) {
    const group = await this.chatService.checkIsGroupMember(sendMessageDto.to, userAuth.userId, language);

    const message = await this.chatService.sendGroupMessage(userAuth.userId, sendMessageDto);

    this.chatGateway.sendGroupMessage(message, group);
    this.chatService.sendGroupMessageNotification(message);
    return message;
  }

  @Get('contacts')
  @UseGuards(UserGuard)
  getContacts(@UserJwt() userAuth: UserAuth): Promise<Contact[]> {
    this.chatService.getPrivateMessagesIsNotSent(userAuth.userId).then(messages => {
      if (messages.length > 0) {
        this.chatService.setPrivateMessagesIsSent(messages.map(e => e.id));

        const users: Object = {};
        for (const message of messages) {
          if (users[message.senderId] == null) users[message.senderId] = [];
          users[message.senderId].push(message.id);
        }

        Object.entries(users).forEach(entry => {
          const [userId, messagesIds] = entry;
          this.chatGateway.sendPrivateMessagesIsSent(userId, userAuth.userId, messagesIds);
        });
      }
    });

    return this.chatService.getContacts(userAuth.userId);
  }

  @Get('get-group-status/:id')
  getGroupStatus(@Param('id') groupId: string) {
    return this.chatService.getGroupStatus(groupId);
  }

  @Get('private-messages/:id')
  @UseGuards(UserGuard)
  async getPrivateMessages(@UserJwt() userAuth: UserAuth, @Param('id') contactId: string, @Query() paginationQueryDto: PaginationQueryDto): Promise<PrivateMessage[]> {
    if (paginationQueryDto.offset == 0) {
      const messagesIds = await this.chatService.setPrivateMessagesIsSeen(contactId, userAuth.userId);
      await this.chatGateway.sendPrivateMessagesIsSeen(contactId, userAuth.userId, messagesIds);
    }
    return this.chatService.getPrivateMessages(userAuth.userId, contactId, paginationQueryDto);
  }

  @Get('group-messages/:id')
  @UseGuards(UserGuard)
  getGroupMessages(@UserJwt() userAuth: UserAuth, @Param('id') groupId: string, @Query() paginationQueryDto: PaginationQueryDto): Promise<GroupMessage[]> {

    return this.chatService.getGroupMessages(userAuth.userId, groupId, paginationQueryDto);
  }

  @Post('set-private-seen/:id')
  @UseGuards(UserGuard)
  async setPrivateSent(@UserJwt() userAuth: UserAuth, @Param('id') contactId: string) {

    const messagesIds = await this.chatService.setPrivateMessagesIsSeen(contactId, userAuth.userId);
    await this.chatGateway.sendPrivateMessagesIsSeen(contactId, userAuth.userId, messagesIds);

    return;
  }


  @Post('mute-notification')
  @UseGuards(UserGuard)
  muteNotification(@UserJwt() userAuth: UserAuth, @Body('contactId') contactId: string) {
    return this.chatService.muteNotification(userAuth.userId, contactId);
  }

  @Post('un-mute-notification')
  @UseGuards(UserGuard)
  unMuteNotification(@UserJwt() userAuth: UserAuth, @Body('contactId') contactId: string) {
    return this.chatService.unMuteNotification(userAuth.userId, contactId);
  }

  @Delete('clear-private-chat/:id')
  @UseGuards(UserGuard)
  clearPrivateChat(@UserJwt() userAuth: UserAuth, @Param('id') contentId: string) {
    return this.chatService.clearPrivateChat(userAuth.userId, contentId);
  }

  @Delete('clear-group-chat/:id')
  @UseGuards(UserGuard)
  clearGroupChat(@UserJwt() userAuth: UserAuth, @Param('id') groupId: string) {
    return this.chatService.clearGroupChat(userAuth.userId, groupId);
  }

  @Post('join-group')
  @UseGuards(UserGuard)
  joinGroup(@UserJwt() userAuth: UserAuth, @Body('groupId') groupId: string) {
    return this.chatService.joinGroup(userAuth.userId, groupId);
  }


  @Delete('exist-group/:id')
  @UseGuards(UserGuard)
  existGroup(@UserJwt() userAuth: UserAuth, @Param('id') groupId: string) {
    return this.chatService.existGroup(userAuth.userId, groupId);
  }

  @Post('report')
  @UseGuards(UserGuard)
  reportPrivateChat(@UserJwt() userAuth: UserAuth, @Body('userId') contactId: string) {
    return this.chatService.reportPrivateChat(userAuth.userId, contactId);
  }

  @Post('report-group')
  @UseGuards(UserGuard)
  reportGroupChat(@UserJwt() userAuth: UserAuth, @Body('groupId') groupId: string) {
    return this.chatService.reportGroupChat(userAuth.userId, groupId);
  }

  @Post('block')
  @UseGuards(UserGuard)
  async blockPrivateChat(@UserJwt() userAuth: UserAuth, @Body('userId') contactId: string) {
    await this.chatService.blockPrivateChat(userAuth.userId, contactId);
    this.chatGateway.sendRefreshContacts(userAuth.userId);
  }

  @Post('un-block')
  @UseGuards(UserGuard)
  async unBlockPrivateChat(@UserJwt() userAuth: UserAuth, @Body('userId') contactId: string) {
    await this.chatService.unBlockPrivateChat(userAuth.userId, contactId);
    this.chatGateway.sendRefreshContacts(userAuth.userId);
  }

  @Post('call-request')
  @UseGuards(UserGuard)
  async callRequest(@UserJwt() userAuth: UserAuth, @Headers('Language') language: string, @Body('userId') userId: string, @Body('isVideo') isVideo: boolean) {

    const data = await Promise.all([
      this.chatService.checkIsBlock(userAuth.userId, userId),
      this.chatGateway.isUserOnline(userId),
    ])
    const isBlock = data[0];
    const isOnline = data[1];

    if (!isBlock && !isOnline) {
      this.chatService.sendMissingCallNotification(userAuth.userId, userId, isVideo);
    }
    if (isBlock || !isOnline) throw new BadRequestException(language == 'ar' ? 'هذا المستخدم غير متاح' : 'This User is Offline')

    this.chatGateway.sendCallRequest(userAuth.userId, userId, isVideo);
  }


  @Post('close-call')
  @UseGuards(UserGuard)
  closeCall(@UserJwt() usetAuth: UserAuth, @Body('userId') userId: string) {
    this.chatGateway.sendCloseCall(usetAuth.userId, userId);
  }

  @Post('accept-call')
  @UseGuards(UserGuard)
  acceptCall(@UserJwt() usetAuth: UserAuth, @Body('userId') userId: string) {
    this.chatGateway.sendAcceptCall(usetAuth.userId, userId);
  }

  @Post('create-group')
  @UseGuards(UserGuard)
  createGroup(@UserJwt() usetAuth: UserAuth, @Body() createGroupDto: CreateGroupDto) {
    return this.chatService.createGroup(usetAuth.userId, createGroupDto);
  }
}
