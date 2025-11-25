import { Controller, Query, Get, Delete, HttpCode, HttpStatus, Patch, Body, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { UsersPdfService } from './users-pdf.service';
import { UsersSearchDto } from './dto/usersSearch.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersPdfService: UsersPdfService,
  ) { }

  @ApiOperation({ summary: "Obtener todos los usuarios (Administrador)", description: "Obtiene listado completo de usuarios" })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos correctamente' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: "Buscar Usuario (Administrador)", description: "Busca un usuario por email, nombre o cédula" })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'No se encontraron usuarios con los criterios especificados' })
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query() query: UsersSearchDto) {
    return this.usersService.search(query);
  }

  @ApiOperation({ summary: "Actualizar rol de usuario (Administrador)", description: "Actualiza el rol de un usuario" })
  @ApiResponse({ status: 200, description: 'Rol actualizado correctamente' })
  @Patch('update-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateRole(updateUserRoleDto);
  }

  @ApiOperation({ summary: "Eliminar Usuario (Administrador)", description: "Elimina un usuario por email" })
  @ApiResponse({ status: 204, description: 'Usuario eliminado correctamente' })
  @Delete('delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Query('email') email: string) {
    return this.usersService.delete(email);
  }

  @ApiOperation({ summary: 'Exportar usuarios a PDF con filtros opcionales' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'PDF generado exitosamente' })
  @Get('export/pdf')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(UserRole.ADMINISTRADOR)
  async exportToPdf(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Res() res?: Response,
  ) {
    const filters: any = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const pdfBuffer = await this.usersPdfService.generateUsersReport(filters);

    const filename = `usuarios-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @ApiOperation({ summary: 'Exportar estadísticas de usuarios a PDF' })
  @ApiResponse({ status: 200, description: 'PDF de estadísticas generado' })
  @Get('export/pdf/stats')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(UserRole.ADMINISTRADOR)
  async exportStatsToPdf(@Res() res: Response) {
    const pdfBuffer = await this.usersPdfService.generateUsersStatisticsReport();

    const filename = `usuarios-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @ApiOperation({ summary: 'Exportar usuarios de un rol específico a PDF' })
  @ApiResponse({ status: 200, description: 'PDF generado para rol específico' })
  @Get('export/pdf/role/:role')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(UserRole.ADMINISTRADOR)
  async exportByRoleToPdf(
    @Param('role') role: UserRole,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.usersPdfService.generateUsersByRoleReport(role);

    const filename = `usuarios-${role}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(HttpStatus.OK).send(pdfBuffer);
  }
}