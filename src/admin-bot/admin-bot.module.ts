import { Module } from '@nestjs/common';
import { AdminBotService } from './admin-bot.service';
import { AdminBotController } from './admin-bot.controller';

@Module({
  providers: [AdminBotService],
  controllers: [AdminBotController]
})
export class AdminBotModule {}
