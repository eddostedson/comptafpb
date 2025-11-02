import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateRegisseurDto {
  @ApiProperty({ example: 'REG-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: 'jean.martin@cgcs.cg' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+242 06 123 45 67', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'Brazzaville' })
  @IsString()
  region: string;

  @ApiProperty({
    example: ['uuid-chef-1', 'uuid-chef-2'],
    description: 'Liste des IDs des chefs de centres à associer (optionnel)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Chaque ID doit être un UUID valide' })
  chefsCentresIds?: string[];

  @ApiProperty({
    example: ['uuid-centre-1', 'uuid-centre-2'],
    description: 'Liste des IDs des centres à associer (optionnel)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Chaque ID doit être un UUID valide' })
  centresIds?: string[];
}

