import { IsString, IsEmpty } from "class-validator";

export class SendMessageDto{ 
    @IsString()
    @IsEmpty()
    chatId: string;

    @IsString()
    @IsEmpty()
    userId: string;

    @IsString()
    @IsEmpty()
    text: string;

    @IsString()
    @IsEmpty()
    isAdmin: boolean;
}