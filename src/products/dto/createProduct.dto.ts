import { IsString, IsNumber, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Pizza Margarita',
    required: true,
    minLength: 2,
    maxLength: 100,
    type: String
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'Pizza clásica con salsa de tomate, mozzarella y albahaca fresca',
    required: true,
    minLength: 10,
    maxLength: 500,
    type: String
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del producto es requerida' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Precio del producto en dólares',
    example: 12.99,
    required: true,
    minimum: 0.01,
    maximum: 10000,
    type: Number
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  price: number;

  @ApiProperty({
    description: 'Nombre de la categoría a la que pertenece el producto',
    example: 'Pizzas',
    required: true,
    type: String
  })
  @IsString({ message: 'El nombre de la categoría debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  categoryName: string;
}