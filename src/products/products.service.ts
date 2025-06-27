import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<{ message: string; data: Product[] }> {
    try {
      const products = await this.prisma.product.findMany();
      return {
        message: 'Productos obtenidos correctamente',
        data: products,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error al obtener los productos');
    }
  }

  
}