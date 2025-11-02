import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class UpdateChefCentreDto {
  @ApiProperty({ example: 'chef@centre.cg', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123', minLength: 8, required: false })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password?: string;

  @ApiProperty({ example: 'Dupont', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ example: 'Jean', required: false })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ example: '+242 06 123 45 67', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'uuid-du-centre', required: false })
  @IsOptional()
  @IsUUID()
  centreId?: string;

  @ApiProperty({ example: 'uuid-du-regisseur', required: false })
  @IsOptional()
  @IsUUID()
  regisseurId?: string;
}


