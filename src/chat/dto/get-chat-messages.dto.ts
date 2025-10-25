import { IsString, IsNotEmpty } from 'class-validator';

export class GetChatMessagesDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
