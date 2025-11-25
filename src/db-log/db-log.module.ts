import { Module } from '@nestjs/common';
import { DbLogService } from './db-log.service';
import { DbLogController } from './db-log.controller';
import { DbLogPdfService } from './db-log-pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DbLogController],
    providers: [DbLogService, DbLogPdfService],
    exports: [DbLogService],
})
export class DbLogModule { }
