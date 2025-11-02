import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NbeModule } from './nbe/nbe.module';
import { BudgetModule } from './budget/budget.module';
import { AdminModule } from './admin/admin.module';
import { DivisionsAdministrativesModule } from './divisions-administratives/divisions-administratives.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    NbeModule,
    BudgetModule,
    AdminModule,
    DivisionsAdministrativesModule,
    HealthModule,
  ],
})
export class AppModule {}

