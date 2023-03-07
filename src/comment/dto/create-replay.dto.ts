import { IsNotEmpty, IsOptional, IsString, isNotEmpty } from "class-validator";

export class CreateReplayDto {

    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsNotEmpty()
    commentId : string;

}
