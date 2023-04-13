import { IsString, IsOptional, IsArray, IsNotEmpty, ArrayNotEmpty } from "class-validator";

export class CreateGroupDto{

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    picture: string;

    @IsArray()
    @ArrayNotEmpty()
    members: string[];
} 