import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateChefCentreDto {
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

  @ApiProperty({ example: 'CC-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: '+242 06 123 45 67', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'uuid-du-centre', description: 'ID du centre (obligatoire)' })
  @IsUUID()
  centreId: string;

  @ApiProperty({ example: 'uuid-du-regisseur', description: 'ID du régisseur (obligatoire si le centre a un régisseur)' })
  @IsOptional()
  @IsUUID()
  regisseurId?: string;
}






