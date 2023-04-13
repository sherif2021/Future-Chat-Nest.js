import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            delete ret._id;
            delete ret.updatedAt;
        },
    },
    toObject: {
        virtuals: true,
        transform(doc, ret) {
            doc.id = ret._id;
        },
    },
    versionKey: false,
    timestamps: true,
})
export class User extends Document {

    @Prop({ required: true })
    uid: string;

    @Prop({ isRequired: true, maxlength: 64 })
    firstName: string;

    @Prop({ isRequired: true, maxlength: 64 })
    lastName: string;

    @Prop({ isRequired: true, maxlength: 16 })
    phone: string;

    @Prop({ default: null })
    picture?: string;

    @Prop({ default: '' })
    about: string;

    @Prop({ default: true })
    isNotificationEnable: boolean;

    @Prop({ default: true })
    isChatNotificationEnable: boolean;

    @Prop({ default: true })
    isGroupsNotificationEnable: boolean;

    @Prop({ default: 0 })
    profilePicturePrivacy: number;

    @Prop({ default: 0 })
    storyPrivacy: number;

    @Prop({ default: 0 })
    onlinePrivacy: number;

    @Prop({ default: true })
    readReceiptsPrivacy: boolean;

    @Prop({ default: false })
    isBlock: boolean;

    @Prop()
    fcm: string[];

    @Prop()
    roles: string[];

    @Prop()
    unFollowUsers: string[];

    @Prop()
    block: string[];

    @Prop({default : 'en'})
    language? : string;

    @Prop({ default: true })
    isOnline: boolean;

    @Prop({ })
    lastSeen?: Date;

    @Prop({ type: Object })
    stories: object;
}

export const UserSchema = SchemaFactory.createForClass(User);
