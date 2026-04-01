import { Controller, Post, Body } from '@nestjs/common';
import { AdminBotService } from './admin-bot.service';

@Controller('admin-bot')
export class AdminBotController {
    constructor(private readonly adminBotService: AdminBotService) { }

    @Post('ask')
    async askQuestion(@Body('question') question: string) {
        if (!question) {
            return { answer: 'Por favor, hazme una pregunta sobre el panel.' };
        }
        return await this.adminBotService.askQuestion(question);
    }
}