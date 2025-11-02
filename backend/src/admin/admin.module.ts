import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DivisionsAdministrativesModule } from '../divisions-administratives/divisions-administratives.module';

@Module({
  imports: [PrismaModule, DivisionsAdministrativesModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

