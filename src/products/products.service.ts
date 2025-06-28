import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto & { imageUrl?: string }) {
  const { categoryName } = data;

  try {
    const findCategory = await this.prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!findCategory) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        imageUrl: data.imageUrl,
        categoryId: findCategory.id,
      },
    });

    return {
      message: 'Producto creado correctamente',
      data: product,
    };
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Error al crear el producto');
  }
}
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