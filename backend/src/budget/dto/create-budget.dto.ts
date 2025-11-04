import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumberString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TypeBudget } from '@prisma/client';

export enum TypeSourceRecetteDto {
  BE = 'BE',
  RESSOURCES_PROPRES = 'RESSOURCES_PROPRES',
  PTF = 'PTF',
  DONS_LEGS = 'DONS_LEGS',
  FBP = 'FBP',
  CMU = 'CMU',
  SOLDE_BANCAIRE = 'SOLDE_BANCAIRE',
  REMBOURSEMENT_A_RECEVOIR = 'REMBOURSEMENT_A_RECEVOIR',
}

export enum SourceFinancementDto {
  FBP = 'FBP',
  CMU = 'CMU',
  RP = 'RP',
  BE = 'BE',
  AUTRES = 'AUTRES',
}

export class SourceRecetteDto {
  @IsEnum(TypeSourceRecetteDto)
  type: TypeSourceRecetteDto;

  @IsOptional()
  @IsString()
  nature?: string;

  @Transform(({ value }) => {
    // Convertir en string et nettoyer
    if (value === null || value === undefined) {
      return '0';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? '0' : trimmed;
    }
    return String(value);
  })
  @IsString()
  montant: string;
}

export class LigneBudgetaireDto {
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

export class CreateBudgetDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  annee: number;

  @IsEnum(TypeBudget)
  type: TypeBudget;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceRecetteDto)
  sourcesRecettes: SourceRecetteDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneBudgetaireDto)
  lignesBudgetaires: LigneBudgetaireDto[];
}



