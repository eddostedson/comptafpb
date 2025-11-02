import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GeneratePasswordDto {
  @ApiProperty({ example: 'uuid-de-la-demande', description: 'ID de la demande de réinitialisation' })
  @IsUUID()
  requestId: string;
}

