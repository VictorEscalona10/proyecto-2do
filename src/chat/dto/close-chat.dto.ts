// close-chat.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseChatDto {
  @ApiProperty({ description: 'ID del chat a cerrar' })
  @IsString()
  @IsNotEmpty()
  chatId: string;
}