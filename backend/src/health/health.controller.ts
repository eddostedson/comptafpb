import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Vérifier le statut du backend' })
  @ApiResponse({ status: 200, description: 'Backend en ligne et opérationnel' })
  check() {
    return {
      status: 'ok',
      message: 'Backend CGCS est en ligne',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}


