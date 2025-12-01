import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/createGroup.dto';
import { CreateOptionDto } from './dto/createOption.dto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @ApiOperation({ summary: 'Obtener todas las categorías', description: 'Devuelve el listado completo de categorías disponibles.' })
  @ApiResponse({ status: 200, description: 'Listado de categorías obtenido correctamente.' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.categoryService.findAll();
  }

  @ApiOperation({ summary: 'Crear una nueva categoría', description: 'Permite crear una categoría. Solo accesible para roles TRABAJADOR y ADMINISTRADOR.' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para la creación de la categoría.' })
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    const lower = createCategoryDto.name.toLowerCase();
    createCategoryDto.name = lower;
    return this.categoryService.create(createCategoryDto);
  }

  @ApiOperation({ summary: 'Eliminar una categoría', description: 'Elimina una categoría por nombre. Solo accesible para roles TRABAJADOR y ADMINISTRADOR.' })
  @ApiResponse({ status: 204, description: 'Categoría eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @Delete('/delete/:name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('name') name: string) {
    return this.categoryService.delete(name);
  }

  @Get(':id')
  async findUnique(@Param('id') id: string) { // este endpoint se usa asi: 
    const categoryId = parseInt(id, 10);
    return this.categoryService.findUnique(categoryId);
  }

  @ApiOperation({ summary: 'Crear grupo de personalización', description: 'Crea un grupo (ej: Pisos, Rellenos) para una categoría.' })
  @Post('group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR) // Solo Admin debería configurar esto
  @HttpCode(HttpStatus.CREATED)
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.categoryService.createGroup(createGroupDto);
  }

  @ApiOperation({ summary: 'Crear opción de personalización', description: 'Agrega una opción (ej: Chocolate, Vainilla) a un grupo existente.' })
  @Post('option')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  async createOption(@Body() createOptionDto: CreateOptionDto) {
    return this.categoryService.createOption(createOptionDto);
  }

  // Helper para el frontend: Buscar categoría por nombre exacto
  // Esto nos servirá para encontrar el ID de "tortas personalizadas" automáticamente
  @Get('search/:name')
  async findByName(@Param('name') name: string) {
    const category = await this.categoryService.findByName(name.toLowerCase()); // Asegúrate de implementar findByName en el servicio
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }
}
