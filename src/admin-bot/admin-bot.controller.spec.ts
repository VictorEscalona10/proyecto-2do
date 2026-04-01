import { Test, TestingModule } from '@nestjs/testing';
import { AdminBotController } from './admin-bot.controller';

describe('AdminBotController', () => {
  let controller: AdminBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBotController],
    }).compile();

    controller = module.get<AdminBotController>(AdminBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
