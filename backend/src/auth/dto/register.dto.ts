import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { RoleType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'chef@centre.cg' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: '+242 06 123 45 67', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ enum: RoleType, example: RoleType.CHEF_CENTRE })
  @IsEnum(RoleType)
  role: RoleType;

  @ApiProperty({ required: false, description: 'ID du centre (obligatoire pour CHEF_CENTRE)' })
  @IsOptional()
  @IsUUID()
  centreId?: string;

  @ApiProperty({ required: false, description: 'ID du régisseur (obligatoire pour CHEF_CENTRE)' })
  @IsOptional()
  @IsUUID()
  regisseurId?: string;
}

