import { Controller, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtected(): Object {
    return {
      message: 'Acceso concedido',
      statusCode: 200,
    };
  }

  @Get()
  hello(): string {
    return 'API is running';
  }
}
