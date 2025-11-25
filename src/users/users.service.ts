import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersSearchDto } from './dto/usersSearch.dto';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          Identification: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Usuarios obtenidos correctamente',
        data: users,
        count: users.length,
      };

    } catch (error) {
      throw new InternalServerErrorException('Error al obtener usuarios');
    }
  }

  async search(query: UsersSearchDto) {
    try {
      let whereCondition = {};

      if (query.email) {
        whereCondition = { email: query.email };
      } else if (query.Identification) {
        whereCondition = { Identification: query.Identification };
      } else if (query.name) {
        whereCondition = {
          name: {
            contains: query.name,
            mode: 'insensitive'
          }
        };
      }

      const users = await this.prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          Identification: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!users || users.length === 0) {
        throw new NotFoundException('No se encontraron usuarios con los criterios especificados');
      }

      return {
        message: 'Usuarios encontrados',
        data: users,
        count: users.length,
      };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar usuarios');
    }
  }

  async updateRole(updateUserRoleDto: UpdateUserRoleDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: updateUserRoleDto.email }
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const updatedUser = await this.prisma.user.update({
        where: { email: updateUserRoleDto.email },
        data: { role: updateUserRoleDto.role },
        select: {
          id: true,
          name: true,
          email: true,
          Identification: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return {
        message: 'Rol actualizado correctamente',
        data: updatedUser,
      };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar rol');
    }
  }

  async delete(email: string){
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException('No se encontraron usuarios con los criterios especificados');
      }

      await this.prisma.user.update({
        where: { email },
        data: { isActive: false }
      });

      return {
        message: 'Usuario eliminado',
      };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar usuario');
    }
  }
}