import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRegisseurDto {
  @ApiProperty({ example: 'REG-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Martin', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ example: 'Jean', required: false })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ example: 'jean.martin@cgcs.cg', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+242 06 123 45 67', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'Brazzaville', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}






