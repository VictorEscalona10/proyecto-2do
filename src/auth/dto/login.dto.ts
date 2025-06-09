import {IsString, IsNotEmpty, IsEmail} from 'class-validator';

export class LoginDto {
  @IsEmail({}, {message: 'Formato de email invalido'})
  @IsNotEmpty({message: 'El email es requerido'})
  email: string;

  @IsString({message: 'La contraseña debe ser un texto'})
  @IsNotEmpty({message: 'La contraseña es requerida'})
  password: string;
}