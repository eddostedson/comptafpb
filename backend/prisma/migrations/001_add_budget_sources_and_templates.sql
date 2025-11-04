-- Migration: Add SourceRecette, update LigneBudgetaire, add ActivityTemplate
-- Generated for Module 2: Gestion Budgétaire

-- 1. Create TypeSourceRecette enum
DO $$ BEGIN
    CREATE TYPE "TypeSourceRecette" AS ENUM ('BE', 'RESSOURCES_PROPRES', 'PTF', 'DONS_LEGS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create SourceFinancement enum
DO $$ BEGIN
    CREATE TYPE "SourceFinancement" AS ENUM ('FBP', 'CMU', 'RP', 'BE', 'AUTRES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create sources_recettes table
CREATE TABLE IF NOT EXISTS "sources_recettes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "TypeSourceRecette" NOT NULL,
    "nature" TEXT,
    "montant" DECIMAL(15,2) NOT NULL,
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sources_recettes_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "sources_recettes_budgetId_idx" ON "sources_recettes"("budgetId");
CREATE INDEX IF NOT EXISTS "sources_recettes_type_idx" ON "sources_recettes"("type");

-- 4. Add new columns to lignes_budgetaires table
ALTER TABLE "lignes_budgetaires" 
ADD COLUMN IF NOT EXISTS "activiteCle" TEXT,
ADD COLUMN IF NOT EXISTS "typeMoyens" TEXT,
ADD COLUMN IF NOT EXISTS "quantite" DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS "frequence" DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS "coutUnitaire" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "montantActivite" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "ligneNbe" TEXT,
ADD COLUMN IF NOT EXISTS "libelleNbe" TEXT,
ADD COLUMN IF NOT EXISTS "sourceFinancement" "SourceFinancement",
ADD COLUMN IF NOT EXISTS "nbeLineId" TEXT;

-- 5. Add foreign key for nbeLineId
DO $$ BEGIN
    ALTER TABLE "lignes_budgetaires" 
    ADD CONSTRAINT "lignes_budgetaires_nbeLineId_fkey" 
    FOREIGN KEY ("nbeLineId") REFERENCES "nbe_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Create indexes for new columns
CREATE INDEX IF NOT EXISTS "lignes_budgetaires_sourceFinancement_idx" ON "lignes_budgetaires"("sourceFinancement");
CREATE INDEX IF NOT EXISTS "lignes_budgetaires_ligneNbe_idx" ON "lignes_budgetaires"("ligneNbe");
CREATE INDEX IF NOT EXISTS "lignes_budgetaires_nbeLineId_idx" ON "lignes_budgetaires"("nbeLineId");

-- 7. Add foreign key to nbe_lines for lignesBudgetaires relation
ALTER TABLE "nbe_lines" ADD COLUMN IF NOT EXISTS "lignesBudgetairesId" TEXT;

-- 8. Create activity_templates table
CREATE TABLE IF NOT EXISTS "activity_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activiteCle" TEXT NOT NULL,
    "typeMoyens" TEXT NOT NULL,
    "ligneNbe" TEXT,
    "libelleNbe" TEXT,
    "nbeLineId" TEXT,
    "sourceFinancement" "SourceFinancement",
    "centreId" TEXT,
    "utilisationCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_templates_nbeLineId_fkey" FOREIGN KEY ("nbeLineId") REFERENCES "nbe_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activity_templates_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "activity_templates_centreId_idx" ON "activity_templates"("centreId");
CREATE INDEX IF NOT EXISTS "activity_templates_activiteCle_idx" ON "activity_templates"("activiteCle");
CREATE INDEX IF NOT EXISTS "activity_templates_typeMoyens_idx" ON "activity_templates"("typeMoyens");
CREATE INDEX IF NOT EXISTS "activity_templates_ligneNbe_idx" ON "activity_templates"("ligneNbe");

-- 9. Make existing columns nullable if needed (for backward compatibility)
ALTER TABLE "lignes_budgetaires" 
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "libelle" DROP NOT NULL,
ALTER COLUMN "montantPrevu" SET DEFAULT 0;







