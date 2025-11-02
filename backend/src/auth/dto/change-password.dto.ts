import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, NotEquals } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'tempPassword123', description: 'Mot de passe actuel (généré par admin)' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'monNouveauMotDePasse123', minLength: 8, description: 'Nouveau mot de passe personnel' })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  @NotEquals('currentPassword', { message: 'Le nouveau mot de passe doit être différent de l\'ancien' })
  newPassword: string;
}

