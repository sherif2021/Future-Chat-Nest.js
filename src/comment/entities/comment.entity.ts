import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { Document } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import * as mongoose from 'mongoose';

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
export class Comment extends Document {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    @Type(() => User)
    user: User;

    @Prop({ required: true })
    parentId: string;

    @Prop({ required: true })
    isReplay: boolean;

    @Prop({ isRequired: true })
    text: string;

    @Prop({default : 0})
    likes: number;

    @Prop()
    userLikes: string[];

    @Prop()
    isLiked: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
