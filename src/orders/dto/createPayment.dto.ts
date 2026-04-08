import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  orderId: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string; // Para pago móvil/transferencia

  @IsOptional()  // IMPORTANTE: Hacerlo opcional
  @IsString()
  proofBase64?: string; // Ahora es opcional
}