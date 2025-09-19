import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Conexión SMTP configurada correctamente');
    } catch (error) {
      console.error('Error configurando SMTP:', error);
    }
  }

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

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: `✅ Confirmación de Orden #${order.id}`,
        html,
        attachments: [
          {
            filename: `orden-${order.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error enviando email:', error);
      
      // Si hay error con la plantilla, enviar email sin HTML
      if (error.code === 'ENOENT') {
        console.log('Enviando email con texto plano...');
        return this.sendPlainTextEmail(email, order, pdfBuffer);
      }
      
      throw error;
    }
  }

  // Método alternativo si falla la plantilla
  private async sendPlainTextEmail(email: string, order: any, pdfBuffer: Buffer) {
    const text = `
Confirmación de Orden #${order.id}

Fecha: ${order.orderDate.toLocaleDateString('es-ES')}
Cliente: ${order.user.name}

Productos:
${order.orderDetails.map((detail: any, index: number) => 
  `${index + 1}. ${detail.product.name} - ${detail.quantity} x $${detail.unitPrice} = $${detail.unitPrice * detail.quantity}`
).join('\n')}

Total: $${order.total}

Adjunto encontrarás el comprobante en PDF.

¡Gracias por tu compra!
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `✅ Confirmación de Orden #${order.id}`,
      text,
      attachments: [
        {
          filename: `orden-${order.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    return this.transporter.sendMail(mailOptions);
  }
}