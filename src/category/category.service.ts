import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/createCategory.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(category: CreateCategoryDto) {
  try {
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: category.name },
    });

    if (existingCategory) {
      throw new ConflictException('La categoria ya existe');
    }

    const newCategory = await this.prisma.category.create({ data: category });
    return newCategory;
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Error creando la categoria');
  }
}


  async findAll() {
    try {
      const categories = await this.prisma.category.findMany();
      return categories;  
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error obteniendo las categorias');
      
    }
  }

  async delete(name: string){
    try {
      const existingCategory = await this.prisma.category.findUnique({
        where: { name },
      });

      if (!existingCategory) {
        throw new NotFoundException('Categoria no encontrada');
      }

      const category = await this.prisma.category.delete({
        where: { name },
      });
      return category;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error eliminando la categoria');
    }
  }
}
