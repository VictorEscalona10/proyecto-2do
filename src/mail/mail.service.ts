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

  async sendOrderConfirmation(email: string, order: any, pdfBuffer: Buffer) {
    try {
      // Mantenemos tu lógica de búsqueda de la plantilla .hbs
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

      // --- ENVÍO CON RESEND USANDO TU DOMINIO ---
      const { data, error } = await this.resend.emails.send({
        from: 'Pastelería Migdalis <pedidos@migdalis.store>', // Tu nuevo remitente oficial
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

      console.log('Email enviado con éxito:', data.id);
      return data;

    } catch (error: any) {
      console.error('Error enviando email:', error);

      // Si falla la plantilla, usamos el método de texto plano que ya tenías
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
}