import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {

    @IsArray()
    @IsOptional()
    pictures: string[];

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    liveVideoUrl?: string;
}
