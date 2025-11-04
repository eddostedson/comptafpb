import { Module } from '@nestjs/common';
import { NbeService } from './nbe.service';
import { NbeController } from './nbe.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NbeController],
  providers: [NbeService],
})
export class NbeModule {}







