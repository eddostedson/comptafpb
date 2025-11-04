import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneBudgetaireDto } from './create-ligne-budgetaire.dto';

export class UpdateLigneBudgetaireDto extends PartialType(CreateLigneBudgetaireDto) {}

