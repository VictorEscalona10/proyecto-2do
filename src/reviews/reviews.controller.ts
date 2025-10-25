import { Controller, Get, Param, Post, Body, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Obtener todas las reseñas', description: 'Devuelve todas las reseñas almacenadas.' })
  @ApiResponse({ status: 200, description: 'Lista de reseñas encontrada.' })
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAllReviews() {
    return this.reviewsService.getAllReviews();
  }

  @ApiOperation({ summary: 'Obtener reseñas por producto', description: 'Devuelve las reseñas asociadas a un producto.' })
  @ApiResponse({ status: 200, description: 'Lista de reseñas del producto encontrada.' })
  @ApiResponse({ status: 400, description: 'ID de producto inválido.' })
  @Get('product/:id')
  @HttpCode(HttpStatus.OK)
  async getReviewsByProductId(@Param('id') id: string) {
    const productId = parseInt(id, 10);
    return this.reviewsService.getReviewsByProductId(productId);
  }

  @ApiOperation({ summary: 'Obtener reseñas por usuario', description: 'Devuelve las reseñas creadas por un usuario específico.' })
  @ApiResponse({ status: 200, description: 'Lista de reseñas del usuario encontrada.' })
  @ApiResponse({ status: 400, description: 'ID de usuario inválido.' })
  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async getAllReviewsByUserId(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    return this.reviewsService.getAllReviewsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USUARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear reseña', description: 'Crea una nueva reseña para un producto. Requiere autenticación del usuario.' })
  @ApiResponse({ status: 201, description: 'Reseña creada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos al crear la reseña.' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Body() body: CreateReviewDto) {
    return this.reviewsService.createReview(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USUARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar reseña', description: 'El usuario puede eliminar su reseña por ID.' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada.' })
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('id') id: string) {
    const reviewId = parseInt(id, 10);
    return this.reviewsService.deleteReview(reviewId);
  }
}
