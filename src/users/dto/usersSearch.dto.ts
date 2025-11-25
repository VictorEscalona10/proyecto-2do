import { IsEmail, IsOptional, MaxLength, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

  @ApiProperty({
    description: 'Nombre del usuario para búsqueda parcial',
    example: 'Juan Pérez',
    required: false,
    maxLength: 100,
    nullable: true
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'Cédula del usuario para búsqueda exacta',
    example: '12345678',
    required: false,
    type: Number
  })
  @IsInt({ message: 'La cédula debe ser un número entero' })
  @IsOptional()
  @Type(() => Number)
  Identification?: number;
}