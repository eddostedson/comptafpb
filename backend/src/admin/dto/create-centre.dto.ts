import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateCentreDto {
  @ApiProperty({ example: 'CS-0001', required: false, description: 'Généré automatiquement si non fourni' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Centre de Santé de Brazzaville' })
  @IsString()
  nom: string;

  @ApiProperty({ example: '1 Avenue de la Santé' })
  @IsString()
  adresse: string;

  @ApiProperty({ example: 'Moungali', description: 'Commune' })
  @IsString()
  commune: string;

  @ApiProperty({ example: 'Brazzaville', required: false, description: 'Sous-préfecture (optionnel)' })
  @IsOptional()
  @IsString()
  sousPrefecture?: string;

  @ApiProperty({ example: 'Brazzaville', description: 'Chef-lieu (anciennement Province)' })
  @IsString()
  chefLieu: string;

  @ApiProperty({ example: 'Pool', description: 'Département (anciennement Région)' })
  @IsString()
  departement: string;

  @ApiProperty({ example: 'Brazzaville', description: 'Région (anciennement Commune)' })
  @IsString()
  region: string;

  @ApiProperty({ example: '+242 05 001 00 00', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'centre@cgcs.cg', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Public' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'CSR–D PUBLIC' })
  @IsString()
  niveau: string;

  @ApiProperty({ example: 'uuid-du-regisseur', required: false })
  @IsOptional()
  @IsUUID()
  regisseurId?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

