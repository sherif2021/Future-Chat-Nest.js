import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {

    @IsArray()
    @IsOptional()
    media: Object[];

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    liveVideoUrl?: string;
}
