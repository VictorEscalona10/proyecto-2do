import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(parseInt(id));
  }
}