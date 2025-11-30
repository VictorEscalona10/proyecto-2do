import { IsString, IsNumber, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  priceExtra: number;

  @IsInt()
  groupId: number;
}