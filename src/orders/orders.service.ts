import { Injectable, Logger, NotFoundException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { MailService } from '../mail/mail.service';
import { PdfService } from './pdf.service';
import { UpdateStatusOrderDto } from './dto/updateStatusOrder.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private pdfService: PdfService,
  ) { }

  async getDolarBcv() {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();
    return data.promedio;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { userId, items } = createOrderDto;

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

      // 4. Crear la orden en la base de datos (guardar en dólares)
      const order = await this.prisma.order.create({
        data: {
          userId,
          total: total, // Guardar el total en dólares
          orderDetails: {
            create: items.map(item => ({
              productId: item.id,
              quantity: item.count,
              unitPrice: item.price,
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
            },
          },
        },
      });

      this.logger.log(`Orden #${order.id} creada para usuario ${user.email}`);

      // 5. Preparar datos para el PDF (convertir Decimal a number)
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
        dolarValue, // Agregar el valor del dólar al PDF
      };

      // 6. Generar PDF
      const pdfBuffer = await this.pdfService.generateOrderPdf(orderForPdf);

      // 7. Enviar email con el PDF
      await this.mailService.sendOrderConfirmation(user.email, orderForPdf, pdfBuffer);

      this.logger.log(`Email de confirmación enviado a ${user.email}`);

      return {
        success: true,
        order: orderForPdf,
        message: 'Orden creada y email enviado correctamente'
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
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => ({
      ...order,
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
          },
        },
      },
    });

    if (!order) return null;

    return {
      ...order,
      total: Number(order.total),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        unitPrice: Number(detail.unitPrice),
        product: {
          ...detail.product,
          price: Number(detail.product.price)
        }
      }))
    };
  }

  async updateStatus(data: UpdateStatusOrderDto) {
    const { id, status } = data;

    try {
      return await this.prisma.order.update({
        where: { id },
        data: { status },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }
      throw new InternalServerErrorException('Error actualizando la orden');
    }
  }

}