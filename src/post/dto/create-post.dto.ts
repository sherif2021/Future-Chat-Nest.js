import { IsArray, IsOptional, IsString } from "class-validator";

export class CreatePostDto {


    @IsString()
    @IsOptional()
    user: string;

    @IsArray()
    @IsOptional()
    pictures: string[];

    @IsArray()
    @IsOptional()
    tags: string[];

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    liveVideoUrl?: string;

    @IsArray()
    @IsOptional()
    videos?: string[];
}
