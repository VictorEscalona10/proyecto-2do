import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID del usuario que crea la reseña',
    example: 123,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'El userId debe ser un número entero' })
  userId: number;

  @ApiProperty({
    description: 'ID del producto reseñado',
    example: 45,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'El productId debe ser un número entero' })
  productId: number;

  @ApiProperty({
    description: 'Calificación del producto (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'La calificación debe ser un número entero entre 1 y 5' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating: number;

  @ApiProperty({
    description: 'Comentario opcional del usuario',
    example: 'Muy buen producto, volvería a comprar.',
    required: false,
    maxLength: 500,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'El comentario debe ser un texto' })
  @MaxLength(500, { message: 'El comentario no puede exceder los 500 caracteres' })
  comment?: string;
}