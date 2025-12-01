import { IsString, IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  minSelection: number;

  @IsInt()
  @Min(1)
  maxSelection: number;

  @IsInt()
  categoryId: number;
}