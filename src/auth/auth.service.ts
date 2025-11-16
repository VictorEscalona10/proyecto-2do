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
        id: true,
        email: true,
        password: true,
        role: true,
      }
    });

    if (!findUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await this.comparePasswords(password, findUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = {
      id: findUser.id,
      email: findUser.email,
      role: findUser.role
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return { message: 'Inicio de sesión exitoso!', token };
  }

  async register(user: RegisterDto, role?: UserRole) {
    const { name, email, password, repeatPassword, identification, phoneNumber } = user;

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
        Identification: identification,
        phoneNumber: phoneNumber,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }).catch(error => {
      throw new InternalServerErrorException('Error al registrar el usuario', error);
    });

    return { message: 'usuario registrado exitosamente' };
  }

  async getCurrentUser(token: string): Promise<{ authenticated: boolean; user?: any; message?: string }> {
    if (!token) {
      return {
        authenticated: false,
        message: 'No autenticado - Token faltante'
      };
    }

    try {
      // Verificar el token
      const decoded = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });

      if (!user) {
        return {
          authenticated: false,
          message: 'Usuario no encontrado en la base de datos'
        };
      }

      return {
        authenticated: true,
        user: user
      };
    } catch (error) {
      console.error('❌ Error verificando token:', error);

      if (error.name === 'TokenExpiredError') {
        return {
          authenticated: false,
          message: 'Token expirado'
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          authenticated: false,
          message: 'Token inválido'
        };
      } else {
        return {
          authenticated: false,
          message: 'Error verificando token'
        };
      }
    }
  }
}
