import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, UseGuards, Patch, Put } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateStatusOrderDto } from './dto/updateStatusOrder.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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

  @Get('/user/:email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)

  async findByUserEmail(@Param('email') email: string) {
    return this.orderService.findByUser(email);
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)

  async updateStatus(@Body() data: UpdateStatusOrderDto) {
    return this.orderService.updateStatus(data);
  }
}