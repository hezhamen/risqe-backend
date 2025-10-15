import { Test, TestingModule } from '@nestjs/testing';
import { RoscaController } from './rosca.controller';

describe('RoscaController', () => {
  let controller: RoscaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoscaController],
    }).compile();

    controller = module.get<RoscaController>(RoscaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
