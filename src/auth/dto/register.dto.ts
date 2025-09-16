import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    required: true,
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@ejemplo.com',
    required: true,
    format: 'email'
  })
  @IsEmail({}, { message: 'Formato de email invalido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña segura del usuario',
    example: 'SecurePassword123!',
    required: true,
    pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$',
    minLength: 8,
    format: 'password'
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'La contraseña debe contener minimo 8 caracteres, incluyendo una mayuscula, un numero, y un caracter especial',
  })
  password: string;

  @ApiProperty({
    description: 'Confirmación de la contraseña',
    example: 'SecurePassword123!',
    required: true,
    minLength: 8,
    format: 'password'
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  repeatPassword: string;
}