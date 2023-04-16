import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

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

    @IsBoolean()
    @IsOptional()
    isChatNotificationEnable: boolean;

    @IsBoolean()
    @IsOptional()
    isGroupsNotificationEnable: boolean;

    @IsNumber()
    @IsOptional()
    profilePicturePrivacy: number;

    @IsNumber()
    @IsOptional()
    storyPrivacy: number;

    @IsNumber()
    @IsOptional()
    onlinePrivacy: number;

    @IsBoolean()
    @IsOptional()
    readReceiptsPrivacy: boolean;

    @IsString()
    @IsOptional()
    picture? : string;

    @IsString()
    @IsOptional()
    language? : string;
}
