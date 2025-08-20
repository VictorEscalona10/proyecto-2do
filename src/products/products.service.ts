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

  async update(
    id: number,
    data: Partial<CreateProductDto> & { imageUrl?: string; categoryName?: string }
  ): Promise<{ message: string; data: Product }> {
    try {
      let categoryId: number | undefined = undefined;

      if (data.categoryName) {
        const findCategory = await this.prisma.category.findUnique({
          where: { name: data.categoryName },
        });
        if (!findCategory) {
          throw new NotFoundException('Categoría no encontrada');
        }
        categoryId = findCategory.id;
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price ? new Prisma.Decimal(data.price) : undefined,
          imageUrl: data.imageUrl,
          categoryId: categoryId,
        },
      });

      return {
        message: 'Producto actualizado correctamente',
        data: updatedProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al actualizar el producto');
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      await this.prisma.product.delete({ where: { id } });

      return { message: 'Producto eliminado correctamente' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al eliminar el producto');
    }
  }

  async search(query: { name?: string; categoryName?: string; price?: number }) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          ...(query.name && { name: { contains: query.name, mode: 'insensitive' } }),
          ...(query.price && { price: new Prisma.Decimal(query.price) }),
          ...(query.categoryName && {
            category: {
              name: { contains: query.categoryName, mode: 'insensitive' }
            }
          }),
        },
        include: { category: true },
      });
      return {
        message: 'Productos encontrados',
        data: products,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar productos');
    }
  }

  
}