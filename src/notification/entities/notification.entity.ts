import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

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
export class Notification extends Document {


    @Prop({isRequired : true})
    userId: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    @Type(() => User)
    sender?: User;

    @Prop({ required: true })
    type: number;

    @Prop({default : false})
    isRead: boolean;

    @Prop()
    contentId : string;

    @Prop()
    name? : string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
