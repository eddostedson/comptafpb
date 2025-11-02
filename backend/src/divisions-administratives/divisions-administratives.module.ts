import { Module } from '@nestjs/common';
import { DivisionsAdministrativesService } from './divisions-administratives.service';
import { DivisionsAdministrativesController } from './divisions-administratives.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DivisionsAdministrativesService],
  controllers: [DivisionsAdministrativesController],
  exports: [DivisionsAdministrativesService],
})
export class DivisionsAdministrativesModule {}
