import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { CreateOrderItemDto } from './dto/createOrderItem.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, items: CreateOrderItemDto[]) {
    try {

      const total = items.reduce((sum, item) => {
        return sum + (Number(item.price) * item.count);
      }, 0);


      const order = await this.prisma.$transaction(async (tx) => {

        const newOrder = await tx.order.create({
          data: {
            userId,
            total,
            status: 'Pending',
            orderDetails: {
              create: items.map(item => ({
                productId: item.id,
                quantity: item.count,
                unitPrice: item.price
              }))
            }
          },
          include: {
            orderDetails: {
              include: {
                product: true
              }
            }
          }
        });

        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            method: 'Pending',
            status: 'PENDING'
          }
        });

        return newOrder;
      });

      return {
        message: 'Orden creada correctamente',
        data: order,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al crear la orden');
    }
  }
}
