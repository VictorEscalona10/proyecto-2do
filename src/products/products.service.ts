import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { Prisma, Product } from '@prisma/client';


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateProductDto, publicUrl?: string, path?: string) {
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
          name: data.name.toLocaleLowerCase(),
          description: data.description,
          price: new Prisma.Decimal(data.price),
          imageUrl: publicUrl,
          path: path,
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

  async searchByName(name: string) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          name,
        },
        include: { category: true },
      });

      if (products.length === 0) {
        throw new NotFoundException('No se encontraron productos')
      }
      return {
        message: 'Productos encontrados',
        data: products,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException('Error al buscar productos');
    }
  }

  async searchByCategory(name: string): Promise<Product[]> {
    try {
        const category = await this.prisma.category.findUnique({
            where: { name }
        });

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        const products = await this.prisma.product.findMany({
            where: {
                category: { name }
            },
        });

        return products;

    } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException('Error al buscar productos por categoría');
    }
}
}