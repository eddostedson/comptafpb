import { Test, TestingModule } from '@nestjs/testing';
import { DivisionsAdministrativesService } from './divisions-administratives.service';

describe('DivisionsAdministrativesService', () => {
  let service: DivisionsAdministrativesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DivisionsAdministrativesService],
    }).compile();

    service = module.get<DivisionsAdministrativesService>(DivisionsAdministrativesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
