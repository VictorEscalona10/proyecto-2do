import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLogsDto {
  @ApiPropertyOptional({ description: 'Nombre de la tabla' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: 'Tipo de acción', enum: ['CREATE', 'UPDATE', 'DELETE'] })
  @IsOptional()
  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  action?: string;

  @ApiPropertyOptional({ description: 'ID del registro afectado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  recordId?: number;

  @ApiPropertyOptional({ description: 'Página actual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
