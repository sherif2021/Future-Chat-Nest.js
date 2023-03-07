import { IsNotEmpty, IsOptional, IsString, isNotEmpty } from "class-validator";

export class CreateCommentDto {

    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsNotEmpty()
    postId : string;
}
