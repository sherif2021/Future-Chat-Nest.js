import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Report } from 'src/report/entities/report.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { Contact } from './entities/contact.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { ReportTypes } from 'src/common/report-types';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './entities/group.entity';
import { GroupMessage } from './entities/group-message.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationTypes } from 'src/common/notification-types';

@Injectable()
export class ChatService {

  constructor(
    private notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PrivateMessage.name) private privateMessageModel: Model<PrivateMessage>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(GroupMessage.name) private groupMessageModel: Model<GroupMessage>,
  ) { }


  async getUserById(id: string): Promise<User | undefined> {
    return this.userModel.findOne({ _id: id, isBlock: false }).select('firstName lastName picture').exec();
  }

  async getContacts(userId: string): Promise<Contact[]> {

    const data = await Promise.all([
      this.userModel.findOne({ _id: userId, isBlock: false }).select('onlinePrivacy block').exec(),
      this.contactModel.find({ ownerId: userId }).select('-ownerId').exec()
    ]);

    const contactsOwner = data[0];
    const contacts = data[1];

    if (!contactsOwner) throw new UnauthorizedException();

    if (contacts.length > 0) {
      const usersContacts = contacts.filter(e => !e.isGroup).map(e => e.contentId);
      const groupContacts = contacts.filter(e => e.isGroup).map(e => e.contentId);

      const data = await Promise.all([
        this.userModel.find({
          _id: { $in: usersContacts }
        }).select('firstName lastName picture phone isOnline onlinePrivacy lastSeen').exec(),
        this.privateMessageModel.aggregate([
          {
            $match: {
              'deleted': { $nin: [userId] },
              'seenDate': null,
              'receiverId': userId,
              'senderId': { $in: usersContacts },
            }
          },
          { $group: { _id: '$senderId', total: { $sum: 1 } }, },
        ]).exec(),
        this.privateMessageModel.find({ _id: { $in: contacts.map(e => e.lastPrivateMessageId) } }).exec(),
        this.groupModel.find({ _id: { $in: groupContacts.map(e => e) } }).exec(),
        // Promise.all(usersContacts.map(e => this.privateMessageModel.findOne({ $or: [{ senderId: userId, receiverId: e }, { receiverId: userId, senderId: e, isBlock: false }] }).sort({ 'createdAt': -1 }).exec()))
      ])




      const usersData = data[0];
      const groupsData = data[3];
      const unSeenCountData = data[1];
      const lastPrivateMessages = data[2];

      var lastGroupMessages: GroupMessage[] = [];

      if (groupsData.length > 0) {

        lastGroupMessages = await this.groupMessageModel.find({
          _id: { $in: groupsData.map(e => e.lastMessageId) }
        }).populate('sender', 'firstName lastName picture').select('-deleted').exec();
      }

      for (const contact of contacts) {

        contact.unSeenCount = 0;
        contact.isBlock = contactsOwner.block.includes(contact.contentId);

        if (contact.isGroup) {

          for (const group of groupsData) {
            if (group.id == contact.contentId) {
              contact.name = group.name;
              contact.picture = group.picture;
              contact.phone = '';
            }
            for (const lastMessage of lastGroupMessages) {
              if (group.lastMessageId == lastMessage.id) {
                contact.lastGroupMessage = lastMessage.toObject();
              }
            }
          }
        }
        else {
          for (const user of usersData) {
            if (user.id == contact.contentId) {
              contact.name = `${user.firstName.trim()} ${user.lastName.trim()}`;
              contact.picture = user.picture;
              contact.phone = user.phone;

              if (contactsOwner.onlinePrivacy != 2 && user.onlinePrivacy != 2) {
                contact.isOnline = user.isOnline;
                contact.lastSeen = user.lastSeen;
              }
              break;
            }
          }
        }
        for (const unSeen of unSeenCountData) {
          if (unSeen._id == contact.contentId) {
            contact.unSeenCount = unSeen.total;
            break;
          }
        }

        for (const lastPrivateMessage of lastPrivateMessages) {
          if (lastPrivateMessage.senderId == contact.contentId || lastPrivateMessage.receiverId == contact.contentId) {
            contact.lastPrivateMessage = lastPrivateMessage.toObject();
            break;
          }
        }
      }
    }
    return contacts;
  }

  async getPrivateMessages(userId: string, contactId: string, paginationQueryDto: PaginationQueryDto): Promise<PrivateMessage[]> {
    const messages = await this.privateMessageModel.find({
      deleted: { $nin: userId },
      $or: [
        { senderId: userId, receiverId: contactId },
        { receiverId: userId, senderId: contactId, isBlock: false },
      ]
    })
      .sort({ 'createdAt': -1 })
      .limit(paginationQueryDto.limit)
      .skip(paginationQueryDto.offset)
      .exec();
    return messages;
  }

  async getGroupMessages(userId: string, groupId: string, paginationQueryDto: PaginationQueryDto): Promise<GroupMessage[]> {

    const group = await this.groupModel.findOne({ _id: groupId, members: { $in: userId } }).exec();

    if (!group) return [];

    const messages = await this.groupMessageModel.find({
      groupId: groupId,
      deleted: { $nin: [userId] },
    })
      .sort({ 'createdAt': -1 })
      .limit(paginationQueryDto.limit)
      .skip(paginationQueryDto.offset)
      .populate('sender', 'firstName lastName picture')
      .exec();

    return messages;
  }

  async sendPrivateMessage(userId: string, language: string, sendMessageDto: SendMessageDto): Promise<PrivateMessage> {

    const data = await Promise.all([
      this.userModel.findOne({ _id: userId, isBlock: false }).select('block'),
      this.userModel.findById(sendMessageDto.to).select('block'),
    ]);

    const senderUser = data[0];
    const receiverUser = data[1];
    const isBlock = receiverUser.block.includes(userId);

    if (!senderUser) throw new UnauthorizedException();
    if (senderUser.block.includes(sendMessageDto.to)) throw new BadRequestException(language == 'ar' ? 'لا يمكن إرسال رسالة لمستخدم قد حظرته' : 'a message cannot be sent to a user you have blocked')
    if (!receiverUser) throw new NotFoundException(language == 'ar' ? 'هذا المستخدم غير موجود' : 'This User Not Found');

    const messageObject = new this.privateMessageModel({
      senderId: userId,
      receiverId: sendMessageDto.to,
      text: sendMessageDto.text,
      media: sendMessageDto.media,
      isBlock,
    });
    await this.createContactIfNotExist(userId, sendMessageDto.to, false);
    if (!isBlock) {
      await this.createContactIfNotExist(sendMessageDto.to, userId, false);
    }
    const message = await messageObject.save();
    message.tempId = sendMessageDto.tempId;

    this.contactModel.updateOne({ contentId: message.senderId, ownerId: message.receiverId, isGroup: false }, { lastPrivateMessageId: message.id }).exec();
    this.contactModel.updateOne({ contentId: message.receiverId, ownerId: message.senderId, isGroup: false }, { lastPrivateMessageId: message.id }).exec();

    return message;
  }

  async checkIsGroupMember(groupId: string, userId: string, language: string): Promise<Group> {

    const group = await this.groupModel.findOne({ _id: groupId, members: { $in: userId } }).exec();

    if (!group) throw new BadRequestException(language == 'ar' ? '.أنت لست عضوا في هذه المجموعة' : 'Your not a member in this group.');

    return group;
  }

  async sendGroupMessage(userId: string, sendMessageDto: SendMessageDto): Promise<GroupMessage> {

    const sender = await this.userModel.findOne({ _id: userId, isBlock: false }).select('firstName lastName picture').exec();

    if (!sender) throw new UnauthorizedException();

    const messageObject = new this.groupMessageModel({
      sender: userId,
      text: sendMessageDto.text,
      groupId: sendMessageDto.to,
      media: sendMessageDto.media,
    })

    const message = await messageObject.save();
    message.tempId = sendMessageDto.tempId;
    message.sender = sender;

    this.groupModel.updateOne({ _id: sendMessageDto.to }, { lastMessageId: message.id }).exec();

    return message;
  }

  async setPrivateMessagesIsSeen(senderId: string, receiverId: string): Promise<string[]> {

    const result = await this.privateMessageModel.find({
      senderId,
      receiverId,
      seenDate: null
    }).distinct('_id').exec();

    this.privateMessageModel.updateMany({ _id: { $in: result } }, { seenDate: Date.now() }).exec();
    return result;
  }

  async setPrivateMessagesIsSent(messagesIds: string[]) {

    this.privateMessageModel.updateMany({ _id: { $in: messagesIds } }, { sentDate: Date.now() }).exec();
  }

  async getPrivateMessagesIsNotSent(receiverId: string): Promise<PrivateMessage[]> {

    return this.privateMessageModel.find({ receiverId, sentDate: null }).select('_id senderId').exec();
  }


  private async createContactIfNotExist(ownerId: string, contentId: string, isGroup: boolean) {

    await this.contactModel.updateOne(
      { ownerId, contentId, isGroup },
      { ownerId, contentId, isGroup },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  updateIsUserOnline(userId: string, isOnline: boolean) {
    this.userModel.updateOne({ _id: userId }, { isOnline, lastSeen: Date.now() }).exec();
  }


  getUserOnlinePrivacy(userId: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: userId } }).select('onlinePrivacy').exec();
  }

  async getContactsForOnlineStatus(userId: string): Promise<string[]> {
    return this.contactModel.find({ contentId: userId, isGroup: false }).distinct('ownerId').exec();
  }

  async muteNotification(userId: string, contactId: string) {
    this.contactModel.findOneAndUpdate({ ownerId: userId, _id: contactId }, { isNotificationMuted: true }).exec();
  }
  async unMuteNotification(userId: string, contactId: string) {
    this.contactModel.findOneAndUpdate({ ownerId: userId, _id: contactId }, { isNotificationMuted: false }).exec();
  }

  clearPrivateChat(userId: string, contentId: string) {
    this.privateMessageModel.updateMany({
      $or: [
        { senderId: userId, receiverId: contentId },
        { receiverId: userId, senderId: contentId },
      ]
    }, { $addToSet: { deleted: userId } }).exec();
  }

  clearGroupChat(userId: string, groupId: string) {
    this.groupMessageModel.updateMany({
      groupId,
    }, { $addToSet: { deleted: userId } }).exec();
  }

  existGroup(userId: string, groupId: string) {
    this.contactModel.deleteOne({ ownerId: userId, contentId: groupId, isGroup: true }).exec();
    this.groupMessageModel.deleteMany({ sender: userId, groupId }).exec();
    this.groupModel.updateOne({
      groupId,
    }, { $pull: { members: userId } }).exec();
  }

  async joinGroup(userId: string, groupId: string) {
    await Promise.all([
      this.groupModel.updateOne({
        groupId,
      }, { $addToSet: { members: userId } }).exec(),
      this.createContactIfNotExist(
        userId,
        groupId,
        true
      )
    ]);
  }

  async reportPrivateChat(userId: string, contactId: string) {
    const reportObject = new this.reportModel({ user: userId, contentId: contactId, type: ReportTypes.privateChat });
    reportObject.save();
  }

  async reportGroupChat(userId: string, groupId: string) {
    const reportObject = new this.reportModel({ user: userId, contentId: groupId, type: ReportTypes.groupChat });
    reportObject.save();
  }

  async blockPrivateChat(userId: string, contactId: string) {
    await this.userModel.updateOne({ _id: userId }, { $addToSet: { block: contactId } }).exec();
  }
  async unBlockPrivateChat(userId: string, contactId: string) {
    await this.userModel.updateOne({ _id: userId }, { $pull: { block: contactId } }).exec();
  }


  async checkIsBlock(userId: string, targetId: string): Promise<boolean> {

    const result = await this.userModel.findOne({
      $or: [
        { _id: targetId, block: { $in: userId } },
        { _id: userId, block: { $in: targetId } },
      ]
    }).exec();

    return result != null;
  }

  async createGroup(userId: string, createGroupDto: CreateGroupDto): Promise<Group> {

    const user = await this.userModel.findOne({ _id: userId, isBlock: false }).select('firstName lastName').exec();

    if (!user) throw new UnauthorizedException();

    createGroupDto.members.push(userId);

    const groupObject = new this.groupModel({ ownerId: userId, ...createGroupDto });

    const group = await groupObject.save();

    // send notification to members

    await Promise.all(createGroupDto.members.map(e => this.createContactIfNotExist(e, group.id, true)));

    return group;
  }

  async getGroupStatus(groupId: string) {
    const group = await this.groupModel.findById(groupId).select('members');
    if (!group) throw new NotFoundException();

    const online = await this.userModel.find({ _id: { $in: group.members }, isOnline: true }).count();


    return {
      'online': online,
      'members': group.members.length,
    }
  }

  async sendPrivateMessageNotification(message: PrivateMessage) {

    const data = await Promise.all([
      this.contactModel.findOne({ ownerId: message.receiverId, isGroup: false, contentId: message.senderId, isNotificationMuted: false }).exec(),
      this.userModel.findOne({ _id: message.receiverId, isBlock: false, block: { $nin: [message.senderId] } }).select('_id isChatNotificationEnable').exec(),
    ]);
    
    const contact = data[0];
    const user = data[1];

    if (!contact || !user || !user.isChatNotificationEnable) return;

    this.notificationService.sendNotifcation(
      message.receiverId,
      NotificationTypes.newPrivateMessage,
      contact.id,
      message.senderId,
      message.text,
    )
  }

  async sendGroupMessageNotification(message: GroupMessage) {

    const group = await this.groupModel.findById(message.groupId);

    if (!group) return;

    for (const member of group.members) {

      if (member != message.sender.id) {

        const data = await Promise.all([
          this.contactModel.findOne({ ownerId: member, contentId: group.id, isGroup: true, isNotificationMuted: false }).exec(),
          this.userModel.findOne({ _id: member, isBlock: false  }).select('_id isGroupsNotificationEnable').exec(),
        ]);

        const user = data[1];
        const contact = data[0];

        if (contact && user.isGroupsNotificationEnable) {

          this.notificationService.sendGroupMessageNotifcation(
            member,
            group.id,
            group.name,
            message.sender.id,
            message.text,
          )
        }
      }
    }
  }

  sendMissingCallNotification(userId: string, targetId: string, isVideo: boolean) {

    this.notificationService.sendNotifcation(
      targetId, isVideo ? NotificationTypes.videoCallMissing : NotificationTypes.voiceCallMissing,
      userId, userId
    )
  }
}
