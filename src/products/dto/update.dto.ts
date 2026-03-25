// src/products/dto/updateProduct.dto.ts
import { IsString, IsNumber, IsOptional, Min, MaxLength, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Nombre del producto', example: 'Pizza Margarita' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ description: 'Descripción detallada', example: 'Nueva descripción...' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ description: 'Precio del producto', example: 15.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  price?: number;

  @ApiPropertyOptional({ description: 'Nombre de la categoría', example: 'Pizzas' })
  @IsOptional()
  @IsString({ message: 'El nombre de la categoría debe ser un texto' })
  categoryName?: string;

  @ApiPropertyOptional({ description: 'Estado activo/inactivo', example: true })
  @IsOptional()
  // Transformamos el string 'true'/'false' del FormData a booleano real
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'El estado debe ser booleano' })
  isActive?: boolean;
}