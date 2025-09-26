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
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Password Reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService
  ) { }

  @ApiOperation({ summary: "Solicitar reseteo de contraseña (Publico)", description: "Inicia el proceso de recuperación de contraseña. El usuario recibe un email con un enlace." })
  @ApiResponse({ status: 200, description: 'Si el email existe, se habrá enviado un correo de recuperación.' })
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

  @ApiOperation({
    summary: 'Resetear la contraseña (Público)',
    description: 'Permite al usuario establecer una nueva contraseña utilizando el token recibido por email.',
  })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El token es inválido, ha expirado o las contraseñas no coinciden.' })
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
}