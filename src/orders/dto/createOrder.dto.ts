import { IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './createOrderItem.dto';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}