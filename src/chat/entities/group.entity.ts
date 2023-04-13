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
export class Group extends Document {

    @Prop({ required: true })
    ownerId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ isRequired: true })
    picture: string;

    @Prop()
    members: string[];

    @Prop()
    lastMessageId? : string;

}

export const GroupSchema = SchemaFactory.createForClass(Group);
