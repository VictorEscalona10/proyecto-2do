import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });

    // Verificar conexión
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión con servidor de email establecida correctamente');
    } catch (error) {
      this.logger.error('Error conectando con servidor de email:', error);
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
    const mailOptions = {
      from: {
        name: 'Soporte de Migdalis Tortas',
        address: this.configService.get('MAIL_FROM'),
      },
      to,
      subject: '🔐 Recuperación de contraseña - Migdalis Tortas',
      html: this.createEmailTemplate(name, resetLink),
      text: `Hola ${name}, para restablecer tu contraseña visita: ${resetLink}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de recuperación enviado a: ${to}`);
      this.logger.debug(`Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error enviando email:', error);
      throw new Error('No se pudo enviar el email de recuperación');
    }
  }

  private createEmailTemplate(name: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .link {
              word-break: break-all;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #667eea;
              margin: 15px 0;
              font-family: monospace;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 15px;
              margin: 15px 0;
              color: #856404;
            }
            @media (max-width: 600px) {
              .content {
                padding: 20px;
              }
              .button {
                display: block;
                margin: 20px auto;
              }
            }
          </style>
      </head>
      <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Migdalis Tortas</h1>
              <p>Recuperación de Contraseña</p>
            </div>

            <div class="content">
              <h2>Hola ${name},</h2>
              <p>Has solicitado restablecer tu contraseña en Migdalis Tortas. Haz clic en el siguiente botón para continuar:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer contraseña</a>
              </div>

              <p>O copia y pega este enlace en tu navegador:</p>
              <div class="link">${resetLink}</div>

              <div class="warning">
                <strong>⏰ Importante:</strong> Este enlace expirará en <strong>15 minutos</strong> por seguridad.
              </div>

              <p>Si no solicitaste este cambio, por favor ignora este email. Tu cuenta está segura.</p>
            </div>

            <div class="footer">
              <p>Saludos,<br><strong>El equipo de Migdalis Tortas</strong></p>
              <p>© ${new Date().getFullYear()} Migdalis Tortas. Todos los derechos reservados.</p>
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
      </body>
      </html>
    `;
  }
}