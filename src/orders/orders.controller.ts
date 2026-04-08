import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, UseGuards, Patch, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateStatusOrderDto } from './dto/updateStatusOrder.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USUARIO, UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async findByUserEmail(@Param('email') email: string) {
    return this.orderService.findByUserEmail(email);
  }

  @Get('/identification/:identification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async findByIdentification(@Param('identification') identification: string) {
    return this.orderService.findByIdentification(identification);
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async updateStatus(@Body() data: UpdateStatusOrderDto) {
    return this.orderService.updateStatus(data);
  }

  @Post(':id/payment-proof')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}))
async uploadPaymentProof(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  console.log('🎯 Endpoint llamado - ID de orden:', id);
  console.log('📁 Archivo recibido en controlador:', {
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
    fieldname: file?.fieldname
  });
  
  const result = await this.orderService.uploadPaymentProof(parseInt(id), file);
  console.log('🎉 Resultado del servicio:', result);
  return result;
}

  @Get(':id/payment-proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async getPaymentProof(@Param('id') id: string) {
    const proofUrl = await this.orderService.getPaymentProof(parseInt(id));
    return { proofUrl };
  }

  @Get(':id/payment-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRABAJADOR, UserRole.ADMINISTRADOR)
  async getPaymentDetails(@Param('id') id: string) {
    return this.orderService.getPaymentDetails(parseInt(id));
  }
}