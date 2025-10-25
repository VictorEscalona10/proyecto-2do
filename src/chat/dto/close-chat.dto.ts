import { IsString, IsNotEmpty } from 'class-validator';

export class CloseChatDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
