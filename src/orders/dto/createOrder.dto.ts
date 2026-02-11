import { IsInt, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

// Esta es la clase de los items individuales
class OrderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  count: number;

  @IsNumber()
  price: number;

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

  @IsEnum(PaymentMethod)
  @IsOptional()  // IMPORTANTE: Debe ser opcional
  paymentMethod?: PaymentMethod; // Por defecto EFECTIVO

  @IsOptional()
  @IsString()
  reference?: string; // Para pago móvil/transferencia

  @IsOptional()  // IMPORTANTE: Debe ser opcional
  @IsString()
  proofBase64?: string; // Para pago móvil/transferencia (ahora opcional)
}