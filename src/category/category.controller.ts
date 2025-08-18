import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/createCategory.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    const lower = createCategoryDto.name.toLowerCase();
    createCategoryDto.name = lower;
    return this.categoryService.create(createCategoryDto);
  }
  
  @Delete(':name')
  delete(@Param('name') name: string) {
    return this.categoryService.delete(name);
  }
}
