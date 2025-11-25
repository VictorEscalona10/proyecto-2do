import { Module } from '@nestjs/common';
import { DbLogService } from './db-log.service';
import { DbLogController } from './db-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DbLogController],
    providers: [DbLogService],
    exports: [DbLogService],
})
export class DbLogModule { }
