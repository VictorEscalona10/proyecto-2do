import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.categoryService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)

  create(@Body() createCategoryDto: CreateCategoryDto) {
    const lower = createCategoryDto.name.toLowerCase();
    createCategoryDto.name = lower;
    return this.categoryService.create(createCategoryDto);
  }
  
  @Delete(':name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)

  delete(@Param('name') name: string) {
    return this.categoryService.delete(name);
  }
}
