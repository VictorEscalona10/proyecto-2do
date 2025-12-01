import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {

  @ApiOperation({
    summary: 'Endpoint de prueba protegido por JWT',
    description: 'Verifica que un usuario esté autenticado. Devuelve un mensaje de éxito si el token JWT es válido.',
  })
  @ApiResponse({ status: 200, description: 'Acceso concedido. El token es válido.' })
  @ApiResponse({ status: 401, description: 'No autorizado. El token falta o es inválido.' })
  @ApiBearerAuth()
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProtected(): Object {
    return {
      message: 'Acceso concedido',
      statusCode: 200,
    };
  }

  @ApiOperation({
    summary: 'Verifica el estado de la API',
    description: 'Endpoint público para confirmar que la API está en funcionamiento.',
  })
  @ApiResponse({ status: 200, description: 'La API está funcionando correctamente.' })
  @Get()
  @HttpCode(HttpStatus.OK)
  hello() {
    return 'API is running...';
  }

  @ApiOperation({
    summary: 'Health check para producción',
    description: 'Verifica el estado de salud de la aplicación con información detallada.',
  })
  @ApiResponse({ status: 200, description: 'La aplicación está saludable.' })
  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }
}
