import { IsString } from "class-validator";
import { IsNumber } from "class-validator";

export class CreateOrderItemDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  categoryId: number;

  @IsNumber()
  count: number;
}
