import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

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
      throw new UnauthorizedException('Contraseña incorrecta');
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

  async register(user: RegisterDto, role?: UserRole) {
    const { name, email, password, repeatPassword } = user;

    if (password !== repeatPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const findUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (findUser) {
      throw new ConflictException('El usuario ya existe!');
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.prisma.user.create({
      data: {
      name: name.toLowerCase(),
      email: email,
      password: hashedPassword,
      role: role ?? UserRole.USUARIO,
      },
      select: {
      name: true,
      email: true,
      role: true,
      },
    }).catch(error => {
      throw new InternalServerErrorException('Error al registrar el usuario', error);
    });

    return { message: 'usuario registrado exitosamente'};
  }

  async getCurrentUser(token: string): Promise<{ authenticated: boolean; user?: any; message?: string }> {
    if (!token) {
      throw new UnauthorizedException('No autenticado');
    }

    try {
      const decoded = this.jwtService.verify(token);
      
      const user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      };

      return {
        authenticated: true,
        user: user
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
