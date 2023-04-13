import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PrivateMessage } from './private-message.entity';

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
export class Contact extends Document {

    @Prop({ required: true })
    ownerId: string;

    @Prop({ required: true })
    contentId: string;

    @Prop({ isRequired: true })
    isGroup: boolean;

    @Prop()
    name: string;

    @Prop()
    picture: string;

    @Prop({})
    lastPrivateMessageId?: string;

    @Prop({ type: Object })
    lastPrivateMessage?: object;

    @Prop({ type: Object })
    lastGroupMessage? : object;

    @Prop()
    unSeenCount?: number;

    @Prop()
    isOnline?: boolean;

    @Prop()
    lastSeen?: Date;

    @Prop()
    phone: string;

    @Prop({ default: false })
    isBlock: boolean;

    @Prop({ default: false })
    isNotificationMuted: boolean;
}


export const ContactSchema = SchemaFactory.createForClass(Contact);
