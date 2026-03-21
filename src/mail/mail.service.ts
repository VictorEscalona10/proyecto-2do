import { Injectable, OnModuleInit } from '@nestjs/common';
import { Resend } from 'resend';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService implements OnModuleInit {
  private resend: Resend;

  onModuleInit() {
    // Inicializamos Resend con la llave que pondrás en Render
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async verifyConnection() {
    console.log('Resend configurado correctamente para migdalis.store');
  }

  // ==========================================
  // MÉTODOS PARA CONFIRMACIÓN DE ÓRDENES
  // ==========================================

  async sendOrderConfirmation(email: string, order: any, pdfBuffer: Buffer) {
    try {
      const templatePath = path.join(process.cwd(), 'src', 'orders', 'templates', 'order-confirmation.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`No se encontró la plantilla en: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const html = template({
        orderNumber: order.id,
        orderDate: order.orderDate.toLocaleDateString('es-ES'),
        customerName: order.user.name,
        total: order.total.toFixed(2),
        items: order.orderDetails.map((detail: any) => ({
          name: detail.product.name,
          quantity: detail.quantity,
          price: detail.unitPrice.toFixed(2),
          subtotal: (detail.unitPrice * detail.quantity).toFixed(2),
        })),
      });

      const { data, error } = await this.resend.emails.send({
        from: 'Pastelería Migdalis <pedidos@migdalis.store>',
        to: [email],
        subject: `✅ Confirmación de Orden #${order.id}`,
        html: html,
        attachments: [
          {
            filename: `orden-${order.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        throw new Error(`Error de Resend: ${error.message}`);
      }

      console.log('Email de orden enviado con éxito:', data.id);
      return data;

    } catch (error: any) {
      console.error('Error enviando email de orden:', error);

      if (error.message.includes('No se encontró la plantilla')) {
        console.log('Enviando email con texto plano...');
        return this.sendPlainTextEmail(email, order, pdfBuffer);
      }

      throw error;
    }
  }

  private async sendPlainTextEmail(email: string, order: any, pdfBuffer: Buffer) {
    const text = `
Confirmación de Orden #${order.id}
Fecha: ${order.orderDate.toLocaleDateString('es-ES')}
Cliente: ${order.user.name}
Total: $${order.total}

¡Gracias por tu compra!
    `;

    const { data, error } = await this.resend.emails.send({
      from: 'Pastelería Migdalis <pedidos@migdalis.store>',
      to: [email],
      subject: `✅ Confirmación de Orden #${order.id}`,
      text: text,
      attachments: [
        {
          filename: `orden-${order.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // MÉTODOS PARA RECUPERACIÓN DE CONTRASEÑA
  // ==========================================

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        // Asegúrate de usar un correo verificado en tu dominio de Resend
        from: 'Soporte Migdalis <soporte@migdalis.store>', 
        to: [to],
        subject: '🔐 Recuperación de contraseña - Migdalis Tortas',
        html: this.createResetEmailTemplate(name, resetLink),
      });

      if (error) {
        throw new Error(`Error de Resend: ${error.message}`);
      }

      console.log(`Email de recuperación enviado con éxito a: ${to} (ID: ${data.id})`);
      return true;
    } catch (error) {
      console.error('Error enviando email de recuperación:', error);
      throw new Error('No se pudo enviar el email de recuperación');
    }
  }

  private createResetEmailTemplate(name: string, resetLink: string): string {
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