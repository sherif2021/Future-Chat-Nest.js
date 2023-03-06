import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class RegisterDto {

    @IsString()
    @IsNotEmpty()
    idToken: string;
    
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    lastName: string;

    @IsString()
    @IsOptional()
    fcm: string;


    @IsString()
    @IsOptional()
    about: string;

    @IsBoolean()
    @IsOptional()
    isNotificationEnable: boolean;

    @IsString()
    @IsOptional()
    picture? : string;
}
