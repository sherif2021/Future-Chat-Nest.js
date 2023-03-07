import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    versionKey: false,
})
export class PostShare extends Document {

    @Prop({ required : true})
    userId: string;

    @Prop({ required: true })
    postId: string;
}

export const PostShareSchema = SchemaFactory.createForClass(PostShare);
