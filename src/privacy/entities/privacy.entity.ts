import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';

@Schema({
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            if (doc.privacyAr) ret.privacy = ret.privacyAr;
            else ret.privacy = ret.privacyEn;

            if (doc.termsAr) ret.terms = ret.termsAr;
            else ret.terms = ret.termsEn;

            delete ret._id;
            delete ret.updatedAt;
            delete ret.privacyEn;
            delete ret.privacyAr;
            delete ret.termsEn;
            delete ret.termsAr;
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
export class Privacy extends Document {

    @Prop({ default: '' })
    privacyAr: string;

    @Prop({ default: '' })
    privacyEn: string;

    @Prop({ default: '' })
    termsAr: string;

    @Prop({ default: '' })
    termsEn: string;
}

export const PrivacySchema = SchemaFactory.createForClass(Privacy);
