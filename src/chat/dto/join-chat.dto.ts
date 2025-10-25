import { IsString, IsNotEmpty } from 'class-validator';

export class JoinChatDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
