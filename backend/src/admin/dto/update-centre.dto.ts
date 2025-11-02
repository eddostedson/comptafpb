import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCentreDto {
  @ApiProperty({ example: 'Centre de Santé de Brazzaville', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ example: '1 Avenue de la Santé', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: 'Moungali', required: false, description: 'Commune' })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({ example: 'Brazzaville', required: false, description: 'Sous-préfecture (optionnel)' })
  @IsOptional()
  @IsString()
  sousPrefecture?: string;

  @ApiProperty({ example: 'Brazzaville', required: false, description: 'Chef-lieu (anciennement Province)' })
  @IsOptional()
  @IsString()
  chefLieu?: string;

  @ApiProperty({ example: 'Pool', required: false, description: 'Département (anciennement Région)' })
  @IsOptional()
  @IsString()
  departement?: string;

  @ApiProperty({ example: 'Brazzaville', required: false, description: 'Région (anciennement Commune)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: '+242 05 001 00 00', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'centre@cgcs.cg', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Public', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'CSR–D PUBLIC', required: false })
  @IsOptional()
  @IsString()
  niveau?: string;

  @ApiProperty({ example: 'uuid-du-regisseur', required: false })
  @IsOptional()
  @IsUUID()
  regisseurId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

