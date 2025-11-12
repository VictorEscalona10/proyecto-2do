import { Injectable, NotFoundException } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersSearchDto } from './dto/usersSearch.dto';

@Injectable()
export class UsersService {

    constructor(private readonly prisma: PrismaService) {}

    async search(query: UsersSearchDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: query.email
                },
                select: {
                    name: true,
                    email: true,
                    role: true,
                },
            });

            if (!user) {
                throw new NotFoundException('No se encontraron usuarios con los criterios especificados');
            }

            return {
                message: 'Usuario encontrado',
                data: user,
            };

        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Error al buscar usuario');
        }
    }

    async delete(email: string){
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email
                },
            });

            if (!user) {
                throw new NotFoundException('No se encontraron usuarios con los criterios especificados');
            }

            await this.prisma.user.update({
                where: {
                    email
                },
                data: {
                    isActive: false
                }
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
