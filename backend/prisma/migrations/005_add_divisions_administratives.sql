-- CreateTable: divisions_administratives
-- Migration: 005_add_divisions_administratives.sql
-- Description: Création de la table pour stocker les divisions administratives (régions, départements, communes, etc.)

CREATE TABLE IF NOT EXISTS "divisions_administratives" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "region" TEXT,
    "departement" TEXT,
    "chefLieu" TEXT,
    "sousPrefecture" TEXT,
    "commune" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_administratives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "divisions_administratives_code_key" ON "divisions_administratives"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "divisions_administratives_region_idx" ON "divisions_administratives"("region");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "divisions_administratives_departement_idx" ON "divisions_administratives"("departement");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "divisions_administratives_chefLieu_idx" ON "divisions_administratives"("chefLieu");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "divisions_administratives_sousPrefecture_idx" ON "divisions_administratives"("sousPrefecture");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "divisions_administratives_commune_idx" ON "divisions_administratives"("commune");



