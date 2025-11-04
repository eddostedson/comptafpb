import { IsString, IsEnum, IsOptional, IsNumberString } from 'class-validator';
import { SourceFinancementDto } from './create-budget.dto';

export class CreateLigneBudgetaireDto {
  @IsString()
  activiteCle: string;

  @IsString()
  typeMoyens: string;

  @IsNumberString({}, { message: 'La quantité doit être un nombre valide' })
  quantite: string;

  @IsNumberString({}, { message: 'La fréquence doit être un nombre valide' })
  frequence: string;

  @IsNumberString({}, { message: 'Le coût unitaire doit être un nombre valide' })
  coutUnitaire: string;

  @IsOptional()
  @IsString()
  ligneNbe?: string;

  @IsOptional()
  @IsString()
  libelleNbe?: string;

  @IsEnum(SourceFinancementDto)
  sourceFinancement: SourceFinancementDto;
}

