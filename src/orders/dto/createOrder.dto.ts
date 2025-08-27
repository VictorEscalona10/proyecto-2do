// create-order.dto.ts
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './createOrderItem.dto';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto del array
  @Type(() => CreateOrderItemDto) // Transforma cada objeto al DTO
  items: CreateOrderItemDto[];
}