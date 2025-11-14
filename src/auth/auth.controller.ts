import { Controller, Post, Body, Res, UseGuards, Get, Query, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Iniciar sesion (Publico)', description: "Autentica a un usuario y devuelve un token JWT" })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso, devuelve el token de acceso' })
  @ApiResponse({ status: 401, description: 'Contraseña incorrecta' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto, res);
    return res.json(result);
  }

  @ApiOperation({ summary: "Registrar un usuario (Publico)", description: "Crea una nueva cuenta de usuario" })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Los datos proporcionados son inválidos o el email ya existe.' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto, UserRole.USUARIO);
    return result;
  }

  @ApiOperation({ summary: "Registrar un Trabajador (Administrador)", description: "Crea una nueva cuenta de trabajador" })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Los datos proporcionados son inválidos o el email ya existe.' })
  @ApiBearerAuth()
  @Post('register/worker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)

  async registerWorker(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto, UserRole.TRABAJADOR);
    return result;
  }

  @ApiOperation({ summary: "Cerrar sesion (Publico)", description: "Elimina el token de inicio de sesion" })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.json({ message: 'Sesion cerrada exitosamente' });
  }

  @Get('me')
  @ApiOperation({ summary: "Obtener usuario actual", description: "Obtiene el usuario autenticado actualmente a partir del token JWT en las cookies." })
  @ApiResponse({ status: 200, description: 'Usuario autenticado devuelto.' })
  @ApiResponse({ status: 401, description: 'No autenticado o token inválido.' })
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.jwt || req.cookies?.token;
      const result = await this.authService.getCurrentUser(token);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res.status(401).json({
          authenticated: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        message: 'Error interno del servidor',
      });
    }
  }
}