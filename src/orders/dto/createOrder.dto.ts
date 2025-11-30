import { IsInt, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// Esta es la clase de los items individuales
class OrderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  count: number;

  @IsNumber()
  price: number;

  // AGREGA ESTO PARA QUE SE QUITE EL ERROR ROJO
  @IsOptional() 
  customizations?: any; 
}

export class CreateOrderDto {
  @IsInt()
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}