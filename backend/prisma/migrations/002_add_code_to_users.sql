-- Migration: Add code field to users table
-- Date: 2024
-- Description: Ajoute un champ code unique pour les chefs de centres (format: CC-001, CC-002, etc.)

-- Ajouter la colonne code (nullable et unique)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "code" VARCHAR(255);

-- Créer un index unique sur code
CREATE UNIQUE INDEX IF NOT EXISTS "users_code_key" ON "users"("code") WHERE "code" IS NOT NULL;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS "users_code_idx" ON "users"("code");

-- Commentaire sur la colonne
COMMENT ON COLUMN "users"."code" IS 'Code fonctionnel unique (ex: CC-001 pour chef de centre, REG-001 pour régisseur)';







