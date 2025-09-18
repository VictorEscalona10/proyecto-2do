import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Order } from './interfaces/order.interfaces';

@Injectable()
export class PdfService {
  async generateOrderPdf(order: Order): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Usar PDFDocument sin 'default'
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(20).text('CONFIRMACIÓN DE ORDEN', { align: 'center' });
      doc.moveDown();

      // Información de la orden
      doc.fontSize(12);
      doc.text(`Número de Orden: #${order.id}`);
      doc.text(`Fecha: ${order.orderDate.toLocaleDateString('es-ES')}`);
      doc.text(`Estado: ${order.status}`);
      doc.text(`Total: $${order.total.toFixed(2)}`);
      doc.moveDown();

      // Información del cliente
      doc.fontSize(14).text('INFORMACIÓN DEL CLIENTE:');
      doc.fontSize(12);
      doc.text(`Nombre: ${order.user.name}`);
      doc.text(`Email: ${order.user.email}`);
      doc.moveDown();

      // Productos
      doc.fontSize(14).text('PRODUCTOS:');
      doc.moveDown();

      order.orderDetails.forEach((detail, index) => {
        const subtotal = detail.unitPrice * detail.quantity;
        
        doc.text(`${index + 1}. ${detail.product.name}`);
        doc.text(`   Cantidad: ${detail.quantity}`);
        doc.text(`   Precio unitario: $${detail.unitPrice.toFixed(2)}`);
        doc.text(`   Subtotal: $${subtotal.toFixed(2)}`);
        doc.moveDown();
      });

      // Total
      doc.moveDown();
      doc.fontSize(16).text(`TOTAL: $${order.total.toFixed(2)}`, { align: 'right' });

      doc.end();
    });
  }
}