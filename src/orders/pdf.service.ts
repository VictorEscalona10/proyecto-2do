import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Order } from './interfaces/order.interfaces';

@Injectable()
export class PdfService {
  async generateOrderPdf(order: Order): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(22)
        .fillColor('#2c3e50')
        .text('CONFIRMACIÓN DE ORDEN', { align: 'center' })
        .moveDown(1.5);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#3498db').stroke();
      doc.moveDown();

      // ===== Información de la orden =====
      doc.fontSize(14).fillColor('#2c3e50').text('Información de la Orden', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor('black');
      doc.text(`Número de Orden: #${order.id}`);
      doc.text(`Fecha: ${order.orderDate.toLocaleDateString('es-ES')}`);
      doc.text(`Estado: ${order.status}`);
      doc.text(`Tasa de cambio: Bs${order.dolarValue.toFixed(2)} por $1`);
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#bdc3c7').stroke();
      doc.moveDown();

      // ===== Información del cliente =====
      doc.fontSize(14).fillColor('#2c3e50').text('Información del Cliente', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor('black');
      doc.text(`Nombre: ${order.user.name}`);
      doc.text(`Email: ${order.user.email}`);
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#bdc3c7').stroke();
      doc.moveDown();

      // ===== Productos =====
      doc.fontSize(14).fillColor('#2c3e50').text('Productos', { underline: true });
      doc.moveDown(0.5);

      order.orderDetails.forEach((detail, index) => {
        const subtotalDollars = detail.unitPrice * detail.quantity;
        const subtotalBolivares = subtotalDollars * order.dolarValue;

        doc.fontSize(12).fillColor('#34495e').text(`${index + 1}. ${detail.product.name}`);
        doc.fillColor('black');
        doc.text(`   Cantidad: ${detail.quantity}`);
        doc.text(
          `   Precio unitario: $${detail.unitPrice.toFixed(2)}  |  Bs${(
            detail.unitPrice * order.dolarValue
          ).toFixed(2)}`
        );
        doc.text(
          `   Subtotal: $${subtotalDollars.toFixed(2)}  |  Bs${subtotalBolivares.toFixed(2)}`
        );
        doc.moveDown();
      });

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#3498db').stroke();
      doc.moveDown();

      // ===== Totales =====
      const totalBolivares = order.total * order.dolarValue;

      doc
        .fontSize(14)
        .fillColor('#27ae60')
        .text(`TOTAL EN DÓLARES: $${order.total.toFixed(2)}`, { align: 'right' });
      doc
        .fontSize(14)
        .fillColor('#27ae60')
        .text(`TOTAL EN BOLÍVARES: Bs${totalBolivares.toFixed(2)}`, { align: 'right' });

      doc.end();
    });
  }
}
