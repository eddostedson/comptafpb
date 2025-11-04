import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDivisionAdministrativeDto {
  @ApiProperty({ example: 'REG-DEP-COMM-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Abidjan', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'Abidjan', required: false })
  @IsOptional()
  @IsString()
  departement?: string;

  @ApiProperty({ example: 'Abidjan', required: false })
  @IsOptional()
  @IsString()
  chefLieu?: string;

  @ApiProperty({ example: 'Abidjan', required: false })
  @IsOptional()
  @IsString()
  sousPrefecture?: string;

  @ApiProperty({ example: 'Abidjan', required: false })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}






