-- Migration pour mettre à jour les champs du modèle Centre
-- Migration des anciens champs vers les nouveaux

-- 1. Ajouter les nouveaux champs (si ils n'existent pas déjà)
ALTER TABLE "centres" 
  ADD COLUMN IF NOT EXISTS "sousPrefecture" TEXT,
  ADD COLUMN IF NOT EXISTS "chefLieu" TEXT,
  ADD COLUMN IF NOT EXISTS "departement" TEXT;

-- 2. Migrer les données existantes :
--    province -> chefLieu
--    region (ancien) -> departement  
--    commune (ancien) -> region (nouveau)
UPDATE "centres" 
SET 
  "chefLieu" = COALESCE("province", ''),
  "departement" = COALESCE("region", ''),
  "region" = COALESCE("commune", '')
WHERE "chefLieu" IS NULL OR "departement" IS NULL;

-- 3. Rendre les nouveaux champs obligatoires (après migration)
ALTER TABLE "centres" 
  ALTER COLUMN "chefLieu" SET NOT NULL,
  ALTER COLUMN "departement" SET NOT NULL,
  ALTER COLUMN "region" SET NOT NULL;

-- 4. Optionnel : Supprimer l'ancien champ "province" (garder pour compatibilité si nécessaire)
-- ALTER TABLE "centres" DROP COLUMN IF EXISTS "province";






