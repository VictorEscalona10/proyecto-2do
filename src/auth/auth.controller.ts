import { Controller, Post, Body, Res, UseGuards, Get, Query } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async loginUser(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto, res);
    return res.json(result); 
  }

  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto){
    const result = await this.authService.register(registerDto, UserRole.USUARIO);
    return result;
  }

  @Post('register/worker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  async registerWorker(@Body() registerDto: RegisterDto){
    const result = await this.authService.register(registerDto, UserRole.TRABAJADOR);
    return result;
  }
  
  @Post('logout')
  async logoutUser(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.json({ message: 'Sesion cerrada exitosamente' });
  }

}