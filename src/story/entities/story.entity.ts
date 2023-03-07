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
export class Story extends Document {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    @Type(() => User)
    user: User;

    @Prop()
    picture?: string;

    @Prop()
    text?: string;

    @Prop()
    video?: string;

    @Prop()
    backgroundColor?: number;

    @Prop()
    views: number;
    
    @Prop()
    userViews: string[];

    @Prop()
    isViewed: boolean;
}

export const StorySchema = SchemaFactory.createForClass(Story);
