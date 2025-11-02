-- Add new source types: FBP, CMU, SOLDE_BANCAIRE to TypeSourceRecette enum

-- Add new enum values to TypeSourceRecette
ALTER TYPE "TypeSourceRecette" ADD VALUE IF NOT EXISTS 'FBP';
ALTER TYPE "TypeSourceRecette" ADD VALUE IF NOT EXISTS 'CMU';
ALTER TYPE "TypeSourceRecette" ADD VALUE IF NOT EXISTS 'SOLDE_BANCAIRE';



