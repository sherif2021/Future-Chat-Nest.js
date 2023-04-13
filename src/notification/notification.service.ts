import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationQueryDto } from 'src/common/pagination-query.dto';
import { Notification } from './entities/notification.entity';
import { FIREBASE_ADMIN_INJECT, FirebaseAdminSDK } from '@tfarras/nestjs-firebase-admin';
import { User } from 'src/user/entities/user.entity';
import { NotificationTypes } from 'src/common/notification-types';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,

    ) { }


    getNotifications(userId: string, paginationQueryDto: PaginationQueryDto) {

        return this.notificationModel.find({
            userId,
        })
            .sort({ 'createdAt': -1 })
            .limit(paginationQueryDto.limit)
            .skip(paginationQueryDto.offset)
            .populate('sender', 'firstName lastName picture')
            .exec();
    }

    setAllRead(userId: string) {
        this.notificationModel.updateMany({ userId }, { isRead: true }).exec();
    }

    setRead(userId: string, notificationId: string) {
        this.notificationModel.updateOne({ userId, _id: notificationId }, { isRead: true }).exec();
    }

    async sendNotifcation(userId: string, type: number, contentId: string, senderId?: string, message?: string) {

        const user = await this.userModel.findOne({ _id: userId, isBlock: false }).select('block fcm').exec();

        if (user.block.includes(senderId)) return;

        var sender: User = null;

        if (senderId != null) {
            sender = await this.userModel.findOne({ _id: senderId }).select('firstName lastName').exec();
        }

        const noticationObject = new this.notificationModel({
            userId,
            sender: senderId,
            contentId,
            type,
        });
        noticationObject.save();

        var title: string = '';
        var body: string = '';

        switch (type) {

            case NotificationTypes.newPost:
                title = user.language == 'ar' ? 'منشور جديد' : 'New Post';
                body = user.language == 'ar' ? `قام ${sender.firstName} بإنشاء منشور جديد` : `${sender.firstName} create a new Post`;
                break;

            case NotificationTypes.newComment:
                title = user.language == 'ar' ? 'تعليق جديد' : 'New Comment';
                body = user.language == 'ar' ? `قام ${sender.firstName} بالتعليق منشور لك` : `${sender.firstName} comment on your Post`;
                break;

            case NotificationTypes.newReplay:
                title = user.language == 'ar' ? 'رد جديد' : 'New Replay';
                body = user.language == 'ar' ? `قام ${sender.firstName} بالتعليق تعليق لك` : `${sender.firstName} replay on your comment`;
                break;

            case NotificationTypes.newPrivateMessage:
                title = user.language == 'ar' ? `رسالة جديدة من ${sender.firstName}` : `New Message from ${sender.firstName}`;
                body = message ?? '';
                break;

            case NotificationTypes.videoCallMissing:
                title = user.language == 'ar' ? 'مكالمة فيديو' : 'Video Call';
                body = user.language == 'ar' ? `مكالمة فيديو فائتة من${sender.firstName}` : `Missing Video Call from ${sender.firstName}`;
                break;

            case NotificationTypes.voiceCallMissing:
                title = user.language == 'ar' ? 'مكالمة صوتية' : 'Voice Call';
                body = user.language == 'ar' ? `مكالمة صوتية فائتة من${sender.firstName}` : `Missing Voice Call from ${sender.firstName}`;
                break;
        }

        this.firebaseAdmin.messaging().sendMulticast(
            {
                tokens: user.fcm,
                notification: {
                    title,
                    body,
                },
                data: {
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                    'click_type': `${type}`,
                    'click_content': contentId,
                }
            }
        )
    }

    async sendGroupMessageNotifcation(userId: string, groupId: string, groupName: string, senderId: string, message: string) {

        const user = await this.userModel.findOne({ _id: userId }).select('fcm').exec();

        const noticationObject = new this.notificationModel({
            userId,
            contentId: groupId,
            sender: senderId,
            type: NotificationTypes.newGroupMessage,
            name: groupName,
        });
        noticationObject.save();

        const title = user.language == 'ar' ? `رسالة جديدة من ${groupName}` : `New Message from ${groupName}`;
        const body = message ?? '';

        this.firebaseAdmin.messaging().sendMulticast(
            {
                tokens: user.fcm,
                notification: {
                    title,
                    body,
                },
                data: {
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                    'click_type': `${NotificationTypes.newGroupMessage}`,
                    'click_content': groupId,
                }
            }
        )
    }
}
