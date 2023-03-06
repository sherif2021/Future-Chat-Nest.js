import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {

    @IsString()
    @IsNotEmpty()
    idToken: string;

    @IsString()
    @IsOptional()
    fcm?: string;
}
