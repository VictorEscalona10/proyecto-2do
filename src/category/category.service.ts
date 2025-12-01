import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { CreateGroupDto } from './dto/createGroup.dto';
import { CreateOptionDto } from './dto/createOption.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) { }

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

  async findUnique(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {

        customizationGroups: {
          include: {
            options: {
              where: { isAvailable: true } // Solo traer las disponibles
            }
          }
        },
        products: true, // Si también quieres traer los productos pre-hechos
      },
    });
  }

  async delete(name: string) {
    try {
      const existingCategory = await this.prisma.category.findUnique({
        where: { name },
      });

      if (!existingCategory) {
        throw new NotFoundException('Categoria no encontrada');
      }

      const category = await this.prisma.category.update({
        where: { name },
        data: { isActive: false },
      });
      return category;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error eliminando la categoria');
    }
  }

  async createGroup(data: CreateGroupDto) {
    try {
      return await this.prisma.customizationGroup.create({
        data: {
          name: data.name,
          minSelection: data.minSelection,
          maxSelection: data.maxSelection,
          categoryId: data.categoryId,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creando el grupo de personalización');
    }
  }

  // NUEVO: Crear Opción
  async createOption(data: CreateOptionDto) {
    try {
      return await this.prisma.customizationOption.create({
        data: {
          name: data.name,
          priceExtra: data.priceExtra,
          groupId: data.groupId,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creando la opción de personalización');
    }
  }
  
  // Opcional: Método para buscar por nombre si quieres automatizar la búsqueda del ID
  async findByName(name: string) {
    return this.prisma.category.findUnique({
      where: { name },
      include: {
        customizationGroups: {
          include: { options: true }
        }
      }
    });
  }
}
