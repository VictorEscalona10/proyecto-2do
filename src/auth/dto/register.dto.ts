import {IsString, IsNotEmpty, IsEmail, Matches} from 'class-validator';

export class RegisterDto{
    @IsString({message: 'El nombre debe ser un texto'})
    @IsNotEmpty({message: 'El nombre es requerido'})
    name: string;

    @IsEmail({}, {message: 'Formato de email invalido'})
    @IsNotEmpty({message: 'El email es requerido'})
    email: string;
    
    @IsString({message: 'La contraseña debe ser un texto'})
    @IsNotEmpty({message: 'La contraseña es requerida'})
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'La contraseña debe contener minimo 8 caracteres, incuyendo una mayuscula, un numero, y un caracter especial',
  })
    password: string;

    @IsString({message: 'La contraseña debe ser un texto'})
    @IsNotEmpty({message: 'La contraseña es requerida'})
    repeatPassword: string;
    
}