import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDecimal,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeBudget } from '@prisma/client';

export enum TypeSourceRecetteDto {
  BE = 'BE',
  RESSOURCES_PROPRES = 'RESSOURCES_PROPRES',
  PTF = 'PTF',
  DONS_LEGS = 'DONS_LEGS',
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

  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  montant: string;
}

export class LigneBudgetaireDto {
  @IsString()
  activiteCle: string;

  @IsString()
  typeMoyens: string;

  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  quantite: string;

  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  frequence: string;

  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
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



