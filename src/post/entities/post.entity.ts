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
export class Post extends Document {
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    @Type(() => User)
    user: User;

    @Prop()
    pictures: string[];

    @Prop()
    tags: string[];

    @Prop()
    text?: string;

    @Prop()
    likes: number;

    @Prop()
    userLikes: string[];

    @Prop({ default: 0 })
    comments: number;

    @Prop({ default: 0 })
    shares: number;

    @Prop({ default: null })
    liveVideoUrl?: string;

    @Prop()
    videos?: string[];

    @Prop()
    isLiked: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
