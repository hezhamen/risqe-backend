import { Test, TestingModule } from '@nestjs/testing';
import { RoscaService } from './rosca.service';

describe('RoscaService', () => {
  let service: RoscaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoscaService],
    }).compile();

    service = module.get<RoscaService>(RoscaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
