import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [OrderController],
  providers: [OrderService, PdfService],
  exports: [OrderService],
})
export class OrdersModule {}