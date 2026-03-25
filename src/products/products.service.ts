import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { Prisma, Product } from '@prisma/client';


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateProductDto, publicUrl?: string, path?: string) {
  const { categoryId } = data;

  const findCategory = await this.prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!findCategory) {
    throw new NotFoundException('Categoría no encontrada');
  }

  const product = await this.prisma.product.create({
    data: {
      name: data.name.toLowerCase(),
      description: data.description,
      price: new Prisma.Decimal(data.price),
      imageUrl: publicUrl,
      path,
      categoryId,
    },
  });

  return {
    message: 'Producto creado correctamente',
    data: product,
  };
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

  async findAll() {
    try {
      const products = await this.prisma.product.findMany({
        include: { category: true },
        orderBy: { name: 'asc' }
      });

      return {
        message: 'Productos obtenidos correctamente',
        data: products,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los productos');
    }
  }

  async delete(id: number){
    try {
      const findProduct = await this.prisma.product.findUnique({
        where: { id },
      });
      const deleteProduct = await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      if (!findProduct) {
        throw new NotFoundException('Producto no encontrado');
      }
      return {
        message: 'Producto eliminado correctamente',
        data: deleteProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al eliminar el producto');
    } 
  }
  
  async update(id: number, data: any, publicUrl?: string, path?: string) {
    try {
      // 1. Verificamos que el producto exista
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!existingProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      let categoryId = existingProduct.categoryId;

      // 2. Si enviaron un categoryName distinto, validamos que exista esa categoría
      if (data.categoryName && data.categoryName !== existingProduct.category.name) {
        const findCategory = await this.prisma.category.findUnique({
          where: { name: data.categoryName },
        });

        if (!findCategory) {
          throw new NotFoundException(`Categoría '${data.categoryName}' no encontrada`);
        }
        categoryId = findCategory.id;
      }

      // 3. Construimos el objeto solo con los datos que enviaron (para no borrar lo que ya está)
      const updateData: Prisma.ProductUpdateInput = {};
      if (data.name) updateData.name = data.name.toLowerCase();
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (categoryId) updateData.category = { connect: { id: categoryId } };
      
      // Si enviaron una nueva imagen, actualizamos los links
      if (publicUrl) updateData.imageUrl = publicUrl;
      if (path) updateData.path = path;

      // 4. Actualizamos en base de datos
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true }
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
}