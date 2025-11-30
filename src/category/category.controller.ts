import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
}
