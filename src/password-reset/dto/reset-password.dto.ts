import { IsNotEmpty, IsString, Matches, MinLength, Validate, IsJWT } from 'class-validator';
import { PasswordsMatch } from '../validators/password-match.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token JWT de recuperación de contraseña',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    required: true,
    type: String
  })
  @IsJWT({ message: 'El token proporcionado no es válido' })
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña segura',
    example: 'NuevaPassword123!',
    required: true,
    pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$',
    minLength: 8,
    format: 'password'
  })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'La contraseña debe contener mínimo 8 caracteres, incluyendo una mayúscula, un número, y un carácter especial',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña (debe coincidir con newPassword)',
    example: 'NuevaPassword123!',
    required: true,
    format: 'password'
  })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @IsString({ message: 'La confirmación debe ser un texto' })
  @Validate(PasswordsMatch, ['newPassword'], {
    message: 'Las contraseñas no coinciden',
  })
  confirmPassword: string;

  constructor(token: string, newPassword: string, confirmPassword: string) {
    this.token = token;
    this.newPassword = newPassword;
    this.confirmPassword = confirmPassword;
  }
}