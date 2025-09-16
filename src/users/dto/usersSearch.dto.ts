import { IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UsersSearchDto {
  @ApiProperty({
    description: 'Email del usuario para búsqueda exacta',
    example: 'usuario@ejemplo.com',
    required: false,
    format: 'email',
    maxLength: 255,
    nullable: true
  })
  @IsEmail({}, { message: 'Formato de email inválido' })
  @IsOptional()
  @MaxLength(255, { message: 'El email no puede exceder los 255 caracteres' })
  email?: string;
}