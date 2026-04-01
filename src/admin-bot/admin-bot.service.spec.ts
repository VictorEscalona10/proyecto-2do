import { Test, TestingModule } from '@nestjs/testing';
import { AdminBotService } from './admin-bot.service';

describe('AdminBotService', () => {
  let service: AdminBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminBotService],
    }).compile();

    service = module.get<AdminBotService>(AdminBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
