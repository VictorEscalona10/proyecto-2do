import { Controller, Query, Get, Delete, HttpCode, HttpStatus, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersSearchDto } from './dto/usersSearch.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({summary: "Obtener todos los usuarios (Administrador)", description: "Obtiene listado completo de usuarios"})
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos correctamente' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @ApiOperation({summary: "Buscar Usuario (Administrador)", description: "Busca un usuario por email, nombre o cédula"})
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'No se encontraron usuarios con los criterios especificados' })
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query() query: UsersSearchDto) {
    return this.usersService.search(query);
  }

  @ApiOperation({summary: "Actualizar rol de usuario (Administrador)", description: "Actualiza el rol de un usuario"})
  @ApiResponse({ status: 200, description: 'Rol actualizado correctamente' })
  @Patch('update-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateRole(updateUserRoleDto);
  }

  @ApiOperation({summary: "Eliminar Usuario (Administrador)", description: "Elimina un usuario por email"})
  @ApiResponse({ status: 204, description: 'Usuario eliminado correctamente' })
  @Delete('delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Query('email') email: string) {
    return this.usersService.delete(email);
  }
}