import { IsNotEmpty, IsString, Matches, MinLength, Validate, IsJWT } from 'class-validator';
import { PasswordsMatch } from '../validators/password-match.validator';

export class ResetPasswordDto {
  @IsJWT({ message: 'El token proporcionado no es válido' })
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  token: string;

  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'La contraseña debe contener mínimo 8 caracteres, incluyendo una mayúscula, un número, y un carácter especial',
  })
  newPassword: string;

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