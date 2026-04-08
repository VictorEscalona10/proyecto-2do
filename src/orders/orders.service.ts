import { Injectable, Logger, NotFoundException, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { MailService } from '../mail/mail.service';
import { PdfService } from './pdf.service';
import { UpdateStatusOrderDto } from './dto/updateStatusOrder.dto';
import { Status, PaymentMethod } from '@prisma/client';
import { PaymentService } from './payment.service';
import { SupabaseService } from 'src/database-backup/supabase.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private pdfService: PdfService,
    private paymentService: PaymentService,
    private supabase: SupabaseService,
  ) { }

  async getDolarBcv() {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();
    return data.promedio;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { userId, items, paymentMethod = PaymentMethod.EFECTIVO, reference, proofBase64 } = createOrderDto;

    // IMPORTANTE: Solo validar que para métodos no efectivo haya referencia
    // NO validamos proofBase64 aquí porque se subirá después
    if (paymentMethod !== PaymentMethod.EFECTIVO) {
      if (!reference) {
        throw new BadRequestException('Para pagos electrónicos se requiere referencia');
      }
      // NO validamos proofBase64 aquí
    }

    try {
      // 1. Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // 2. Verificar que todos los productos existen
      const productIds = items.map(item => item.id);
      const existingProducts = await this.prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        select: { id: true }
      });

      const existingProductIds = existingProducts.map(p => p.id);
      const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));

      if (missingProductIds.length > 0) {
        throw new NotFoundException(`Productos con IDs ${missingProductIds.join(', ')} no encontrados`);
      }

      // 3. Calcular el total y obtener el valor del dólar
      const total = items.reduce((sum, item) => sum + (Number(item.price) * item.count), 0);
      const dolarValue = await this.getDolarBcv(); // Obtener el valor del dólar

      // 4. Crear la orden en la base de datos
      const order = await this.prisma.order.create({
        data: {
          userId,
          total: total,
          orderDetails: {
            create: items.map(item => ({
              productId: item.id,
              quantity: item.count,
              unitPrice: item.price,
              customizations: item.customizations || null
            })),
          },
        },
        include: {
          orderDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              Identification: true,
            },
          },
        },
      });

      // 5. Crear el pago (SIN comprobante por ahora)
      const paymentData = {
        orderId: order.id,
        method: paymentMethod,
        reference: reference || null,
        proofBase64: null, // IMPORTANTE: null porque se subirá después
      };

      await this.paymentService.createPayment(paymentData);

      this.logger.log(`Orden #${order.id} creada para usuario ${user.email}`);

      // 6. Preparar datos para el PDF
      const orderForPdf = {
        ...order,
        total: Number(order.total),
        orderDetails: order.orderDetails.map(detail => ({
          ...detail,
          unitPrice: Number(detail.unitPrice),
          product: {
            ...detail.product,
            price: Number(detail.product.price)
          }
        })),
        dolarValue,
      };

      // 7. Generar PDF
      const pdfBuffer = await this.pdfService.generateOrderPdf(orderForPdf);

      // 8. Enviar email con el PDF
      await this.mailService.sendOrderConfirmation(user.email, orderForPdf, pdfBuffer);

      this.logger.log(`Email de confirmación enviado a ${user.email}`);

      return {
        success: true,
        order: orderForPdf,
        message: 'Orden creada exitosamente'
      };

    } catch (error) {
      this.logger.error('Error creando orden:', error);

      if (error.code === 'P2003') {
        throw new NotFoundException('Uno o más IDs proporcionados no existen en la base de datos');
      }

      throw error;
    }
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            Identification: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => ({
      ...order,
      // Extraemos de forma segura el método de pago y la referencia
      paymentMethod: order.payments?.[0]?.method || null,
      reference: order.payments?.[0]?.reference || null,
      total: Number(order.total),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        product: {
          ...detail.product,
          price: Number(detail.product.price)
        }
      }))
    }));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            Identification: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        },
      },
    });

    if (!order) return null;

    // Obtener URL firmada fresca para el comprobante si existe
    let paymentProof = null;
    if (order.payments && order.payments.length > 0 && order.payments[0].fileName) {
      try {
        paymentProof = await this.paymentService.getPaymentProof(id);
      } catch (error) {
        this.logger.error(`Error obteniendo comprobante para orden ${id}:`, error);
      }
    }

    return {
      ...order,
      paymentMethod: order.payments?.[0]?.method || null,
      reference: order.payments?.[0]?.reference || null,
      total: Number(order.total),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        product: {
          ...detail.product,
          price: Number(detail.product.price)
        }
      })),
      paymentProof
    };
  }

  async findByUserEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        Identification: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            Identification: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => ({
      ...order,
      // Extraemos de forma segura el método de pago y la referencia
      paymentMethod: order.payments?.[0]?.method || null,
      reference: order.payments?.[0]?.reference || null,
      total: Number(order.total),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        product: {
          ...detail.product,
          price: Number(detail.product.price)
        }
      }))
    }));
  }

  async findByIdentification(identification: string) {
    const user = await this.prisma.user.findUnique({
      where: { Identification: parseInt(identification) },
      select: {
        id: true,
        name: true,
        email: true,
        Identification: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con cédula ${identification} no encontrado`);
    }

    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            Identification: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => ({
      ...order,
      // Extraemos de forma segura el método de pago y la referencia
      paymentMethod: order.payments?.[0]?.method || null,
      reference: order.payments?.[0]?.reference || null,
      total: Number(order.total),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        product: {
          ...detail.product,
          price: Number(detail.product.price)
        }
      }))
    }));
  }

  async updateStatus(data: UpdateStatusOrderDto) {
    const { id, status } = data;

    try {
      return await this.prisma.order.update({
        where: { id },
        data: { status: status as Status },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }
      throw new InternalServerErrorException('Error actualizando la orden');
    }
  }

  // Métodos para manejar comprobantes
  async uploadPaymentProof(orderId: number, file: Express.Multer.File) {
    return this.paymentService.uploadPaymentProof(orderId, file);
  }

  async getPaymentProof(orderId: number) {
    return this.paymentService.getPaymentProof(orderId);
  }

  async getPaymentDetails(orderId: number) {
    return this.paymentService.getPaymentDetails(orderId);
  }
}