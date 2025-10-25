import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllReviews() {
        try {
            return await this.prisma.review.findMany();
        } catch (error) {
            throw new InternalServerErrorException(`Error al buscar todas las reseñas: ${error.message}`);
        }
    }

    async getAllReviewsByUserId(userId: number) {
        try {
            return await this.prisma.review.findMany({
                where: { userId },
            });
        } catch (error) {
            throw new InternalServerErrorException(`Error al buscar reseñas por userId: ${error.message}`);
        }
    }

    async getReviewsByProductId(productId: number) {
        try {
            const reviews = await this.prisma.review.findMany({
                where: { productId },
            });
            return reviews;
        } catch (error) {
            throw new InternalServerErrorException(`Error al buscar reseñas por productId: ${error.message}`);
        }
    }

    async createReview( data :CreateReviewDto) {
        try {
            const newReview = await this.prisma.review.create({
                data: {
                    userId: data.userId,
                    productId: data.productId,
                    rating: data.rating,
                    comment: data.comment,
                },
            });
            return newReview;
        } catch (error) {
            throw new InternalServerErrorException(`Error al crear una reseña: ${error.message}`);
        }
    }

    async deleteReview(reviewId: number) {
        try {
            await this.prisma.review.delete({
                where: { id: reviewId },
            });
            return { message: 'Reseña eliminada correctamente' };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Reseña con id ${reviewId} no encontrada`);
            }
            throw new InternalServerErrorException(`Error al eliminar la reseña: ${error.message}`);
        }
    }
}
