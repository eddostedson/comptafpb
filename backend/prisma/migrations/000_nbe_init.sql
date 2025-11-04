-- 000_nbe_init.sql
-- Crée la table NBE conforme au modèle Prisma `NbeLine`

CREATE TABLE IF NOT EXISTS "nbe_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ligne" text NULL,
  "libelle" text NOT NULL,
  "objetDepense" text NULL,
  "categorie" text NOT NULL,
  "sousCategorie" text NULL,
  "isHeader" boolean NOT NULL DEFAULT false,
  "isHighlighted" boolean NOT NULL DEFAULT false,
  "ordre" integer NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nbe_lines_ligne_idx" ON "nbe_lines" ("ligne");
CREATE INDEX IF NOT EXISTS "nbe_lines_categorie_idx" ON "nbe_lines" ("categorie");
CREATE INDEX IF NOT EXISTS "nbe_lines_sousCategorie_idx" ON "nbe_lines" ("sousCategorie");







