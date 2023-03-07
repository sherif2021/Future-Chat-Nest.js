import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateStoryDto {


    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @IsString()
    video?: string;

    @IsOptional()
    @IsNumber()
    backgroundColor? : number;
}
