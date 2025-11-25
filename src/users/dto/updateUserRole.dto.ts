import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Email del usuario a actualizar',
    example: 'usuario@ejemplo.com',
    required: true
  })
  @IsEmail({}, { message: 'Formato de email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Nuevo rol del usuario',
    example: UserRole.TRABAJADOR,
    enum: UserRole,
    required: true
  })
  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: UserRole;
}