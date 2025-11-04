import { IsOptional, IsString } from 'class-validator';

export class SubmitBudgetDto {
  @IsOptional()
  @IsString()
  commentaire?: string;
}







