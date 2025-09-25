import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { PdfService } from './pdf.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [OrderController],
  providers: [OrderService, PdfService, JwtAuthGuard, RolesGuard],
  exports: [OrderService],
})
export class OrdersModule {}