import { Test, TestingModule } from '@nestjs/testing';
import { DivisionsAdministrativesController } from './divisions-administratives.controller';

describe('DivisionsAdministrativesController', () => {
  let controller: DivisionsAdministrativesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DivisionsAdministrativesController],
    }).compile();

    controller = module.get<DivisionsAdministrativesController>(DivisionsAdministrativesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
