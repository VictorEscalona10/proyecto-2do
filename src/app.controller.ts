import { Controller, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProtected(): Object {
    return {
      message: 'Acceso concedido',
      statusCode: 200,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  hello(){
    return 'API is running...';
  }
}
