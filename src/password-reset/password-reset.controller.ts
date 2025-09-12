import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  Get, 
  Query,
  HttpStatus,
  Res
} from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Response } from 'express';

@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService
  ) {}

  /**
   * Solicitar recuperación de contraseña
   * POST /password-reset/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ 
    message: string;
    success: boolean;
  }> {
    try {
      const result = await this.passwordResetService.forgotPassword(forgotPasswordDto);
      return {
        message: result.message,
        success: true
      };
    } catch (error) {
      return {
        message: 'Error al procesar la solicitud. Por favor, intenta nuevamente.',
        success: false
      };
    }
  }

  /**
   * Restablecer contraseña con token
   * POST /password-recovery/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<{ 
    message: string;
    success: boolean;
  }> {
    try {
      const result = await this.passwordResetService.resetPassword(resetPasswordDto);
      return {
        message: result.message,
        success: true
      };
    } catch (error) {
      let errorMessage = 'Error al restablecer la contraseña.';
      
      if (error.response?.message) {
        errorMessage = error.response.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        message: errorMessage,
        success: false
      };
    }
  }

  /**
   * Validar token de recuperación
   * GET /password-recovery/validate-token?token=xxx
   */
  @Get('validate-token')
  async validateToken(
    @Query('token') token: string
  ): Promise<{ 
    valid: boolean;
    message?: string;
    email?: string;
  }> {
    if (!token) {
      return {
        valid: false,
        message: 'Token no proporcionado'
      };
    }

    try {
      const validationResult = await this.passwordResetService.validateResetToken(token);

      return {
        valid: validationResult.valid,
        email: validationResult.email,
        message: validationResult.valid 
          ? 'Token válido' 
          : 'Token inválido o expirado'
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Error al validar el token'
      };
    }
  }

  /**
   * Health check del módulo
   * GET /password-recovery/health
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ 
    status: string;
    timestamp: string;
    service: string;
  }> {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Password Recovery Service'
    };
  }
}