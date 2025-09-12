import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @IsEmail({}, { 
    message: 'El formato del email no es válido. Por favor, ingresa un email válido.' 
  })
  @IsNotEmpty({ 
    message: 'El email es requerido. Por favor, ingresa tu dirección de email.' 
  })
  @IsString({ 
    message: 'El email debe ser una cadena de texto válida.' 
  })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;
}