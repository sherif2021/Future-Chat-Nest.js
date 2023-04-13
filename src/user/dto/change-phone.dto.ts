import { IsString } from "class-validator";

export class ChangePhoneDto{

    @IsString()
    idToken: string;

    @IsString()
    oldPhone: string;
}