import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService, private readonly configService: ConfigService) { }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(this.configService.get('SALT')) || 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async login(user: LoginDto, res: Response): Promise<{ message: string; token: string }> {
    const { email, password } = user;

    const findUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        password: true,
        role: true,
      }
    });

    if (!findUser) {
      throw new InternalServerErrorException('Usuario no encontrado');
    }

    const isPasswordValid = await this.comparePasswords(password, findUser.password);
    if (!isPasswordValid) {
      throw new InternalServerErrorException('Contraseña incorrecta');
    }

    const payload = {
      email: findUser.email,
      role: findUser.role
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });

    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000,
    });

    return { message: 'Inicio de sesión exitoso!', token };
  }

  async register(user: RegisterDto) {
    const { name, email, password, repeatPassword } = user;

    if (password !== repeatPassword) {
      throw new InternalServerErrorException('Las contraseñas no coinciden');
    }

    const findUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (findUser) {
      throw new InternalServerErrorException('El usuario ya existe!');
    }

    const hashedPassword = await this.hashPassword(password);

    return this.prisma.user.create({
      data: {
      name: name.toLowerCase(),
      email: email,
      password: hashedPassword,
      },
    }).catch(error => {
      throw new InternalServerErrorException('Error al registrar el usuario', error);
    });
  }
}
