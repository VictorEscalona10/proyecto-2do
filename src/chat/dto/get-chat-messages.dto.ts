// get-chat-messages.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetChatMessagesDto {
  @ApiProperty({ description: 'ID del chat' })
  @IsString()
  @IsNotEmpty()
  chatId: string;
}