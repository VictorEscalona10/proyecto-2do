import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por seguridad, siempre devolvemos el mismo mensaje
    if (!user) {
      return { message: 'Si el email existe en nuestro sistema, recibirás instrucciones de recuperación en unos minutos.' };
    }

    try {
      // Invalidar tokens previos
      await this.prisma.passwordResetToken.updateMany({
        where: { 
          userId: user.id,
          isValid: true 
        },
        data: { isValid: false },
      });

      // Crear nuevo token
      const token = this.jwtService.sign(
        { 
          sub: user.id, 
          email: user.email,
          type: 'password_reset'
        },
        { expiresIn: '15m' },
      );

      const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

      // Enviar email
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

      // Guardar token en base de datos
      await this.prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        },
      });

      return { message: 'Si el email existe en nuestro sistema, recibirás instrucciones de recuperación en unos minutos.' };

    } catch (error) {
      console.error('Error en forgotPassword:', error);
      throw new InternalServerErrorException('Error al procesar la solicitud de recuperación');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    try {
      // Verificar token JWT
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token inválido');
      }

      // Verificar en base de datos
      const tokenRecord = await this.prisma.passwordResetToken.findFirst({
        where: { 
          token, 
          isValid: true,
          expiresAt: { gt: new Date() },
          userId: payload.sub,
        },
      });

      if (!tokenRecord) {
        throw new BadRequestException('Token inválido o expirado');
      }

      // Hashear nueva contraseña
      const saltRounds = Number(this.configService.get('SALT')) || 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña del usuario
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      // Invalidar token usado
      await this.prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { isValid: false },
      });

      // Invalidar todos los tokens del usuario
      await this.prisma.passwordResetToken.updateMany({
        where: { 
          userId: payload.sub,
          isValid: true 
        },
        data: { isValid: false },
      });

      return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.' };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('El enlace de recuperación ha expirado. Por favor solicita uno nuevo.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Enlace de recuperación inválido.');
      }
      console.error('Error en resetPassword:', error);
      throw new InternalServerErrorException('Error al restablecer la contraseña');
    }
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        return { valid: false };
      }

      const tokenRecord = await this.prisma.passwordResetToken.findFirst({
        where: { 
          token, 
          isValid: true,
          expiresAt: { gt: new Date() },
          userId: payload.sub,
        },
      });

      return { 
        valid: !!tokenRecord,
        email: payload.email 
      };
    } catch (error) {
      return { valid: false };
    }
  }
}