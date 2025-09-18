import { IsString, IsNumber, IsPositive } from "class-validator";

export class CreateOrderItemDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  categoryId: number;

  @IsNumber()
  @IsPositive()
  count: number;
}