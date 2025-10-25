import { IsString, IsEmpty } from "class-validator";

export class JoinChatDto { 

    @IsString()
    @IsEmpty()
    chatId: string;

    @IsString()
    @IsEmpty()
    userId: string;
}