import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('protected')
  // Usa el guard de JWT para proteger la ruta
  @UseGuards(JwtAuthGuard)
  getProtected(): Object {
    return {
      message: 'Acceso concedido',
      statusCode: 200,
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
