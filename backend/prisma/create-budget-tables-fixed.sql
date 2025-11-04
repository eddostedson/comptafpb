-- Création des tables pour le Module 2 - Gestion Budgétaire
-- Correspondances d'activités aux lignes budgétaires

-- 1. Créer les enums
DO $$ BEGIN
    CREATE TYPE "TypeBudget" AS ENUM ('FONCTIONNEMENT', 'INVESTISSEMENT', 'RESSOURCES_HUMAINES', 'EQUIPEMENT', 'MAINTENANCE', 'FORMATI
ON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatutBudget" AS ENUM ('BROUILLON', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REJETE', 'ARCHIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Créer la table budgets
CREATE TABLE IF NOT EXISTS "budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "annee" INTEGER NOT NULL,
    "type" "TypeBudget" NOT NULL,
    "statut" "StatutBudget" NOT NULL DEFAULT 'BROUILLON',
    "montantTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantValide" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantDepense" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantRestant" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "centreId" UUID NOT NULL,
    "creePar" UUID NOT NULL,
    "validePar" UUID,
    "valideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- 3. Créer la table lignes_budgetaires
CREATE TABLE IF NOT EXISTS "lignes_budgetaires" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "montantPrevu" DECIMAL(15,2) NOT NULL,
    "montantValide" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantEngage" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantPaye" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montantRestant" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chapitre" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "paragraphe" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "sousArticle" TEXT,
    "budgetId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lignes_budgetaires_pkey" PRIMARY KEY ("id")
);

-- 4. Créer la table correspondances_activites
CREATE TABLE IF NOT EXISTS "correspondances_activites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codeActivite" TEXT NOT NULL,
    "nomActivite" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT,
    "sousCategorie" TEXT,
    "ligneBudgetaireId" UUID NOT NULL,
    "pourcentage" DECIMAL(5,2),
    "montantMax" DECIMAL(15,2),
    "priorite" INTEGER NOT NULL DEFAULT 1,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "validePar" UUID,
    "valideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "correspondances_activites_pkey" PRIMARY KEY ("id")
);

-- 5. Créer les contraintes de clés étrangères
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lignes_budgetaires" ADD CONSTRAINT "lignes_budgetaires_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "correspondances_activites" ADD CONSTRAINT "correspondances_activites_ligneBudgetaireId_fkey" FOREIGN KEY ("ligneBudgetaireId") REFERENCES "lignes_budgetaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Créer les index pour optimiser les performances
CREATE UNIQUE INDEX IF NOT EXISTS "budgets_code_key" ON "budgets"("code");
CREATE INDEX IF NOT EXISTS "budgets_centreId_idx" ON "budgets"("centreId");
CREATE INDEX IF NOT EXISTS "budgets_annee_idx" ON "budgets"("annee");
CREATE INDEX IF NOT EXISTS "budgets_type_idx" ON "budgets"("type");
CREATE INDEX IF NOT EXISTS "budgets_statut_idx" ON "budgets"("statut");
CREATE INDEX IF NOT EXISTS "budgets_creePar_idx" ON "budgets"("creePar");

CREATE INDEX IF NOT EXISTS "lignes_budgetaires_budgetId_idx" ON "lignes_budgetaires"("budgetId");
CREATE INDEX IF NOT EXISTS "lignes_budgetaires_code_idx" ON "lignes_budgetaires"("code");
CREATE INDEX IF NOT EXISTS "lignes_budgetaires_chapitre_section_paragraphe_article_idx" ON "lignes_budgetaires"("chapitre", "section", "paragraphe", "article");

CREATE INDEX IF NOT EXISTS "correspondances_activites_codeActivite_idx" ON "correspondances_activites"("codeActivite");
CREATE INDEX IF NOT EXISTS "correspondances_activites_ligneBudgetaireId_idx" ON "correspondances_activites"("ligneBudgetaireId");
CREATE INDEX IF NOT EXISTS "correspondances_activites_categorie_idx" ON "correspondances_activites"("categorie");
CREATE INDEX IF NOT EXISTS "correspondances_activites_valide_idx" ON "correspondances_activites"("valide");

-- 7. Insérer des données d'exemple pour les correspondances d'activités
INSERT INTO "budgets" (
    "id", "code", "nom", "description", "annee", "type", "statut", 
    "montantTotal", "montantValide", "montantRestant", "centreId", "creePar", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 
    'BUD-2024-001', 
    'Budget 2024 - Correspondances d''activités', 
    'Budget prévisionnel 2024 pour les correspondances d''activités',
    2024, 
    'FONCTIONNEMENT', 
    'BROUILLON',
    1300000.00,
    1300000.00,
    1300000.00,
    (SELECT "id" FROM "centres" LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("code") DO NOTHING;

-- Insérer des lignes budgétaires d'exemple
WITH budget_id AS (
    SELECT "id" FROM "budgets" WHERE "code" = 'BUD-2024-001'
)
INSERT INTO "lignes_budgetaires" (
    "id", "code", "libelle", "description", "montantPrevu", "montantValide", "montantRestant",
    "chapitre", "section", "paragraphe", "article", "budgetId", "createdAt", "updatedAt"
) 
SELECT 
    gen_random_uuid(), '01.01.01', 'Salaires du personnel médical', 'Salaires du personnel médical', 250000.00, 250000.00, 250000.00, '01', '01', '01', '01', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id
UNION ALL
SELECT 
    gen_random_uuid(), '01.01.02', 'Salaires du personnel infirmier', 'Salaires du personnel infirmier', 300000.00, 300000.00, 300000.00, '01', '01', '01', '02', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id
UNION ALL
SELECT 
    gen_random_uuid(), '01.01.03', 'Salaires du personnel obstétrical', 'Salaires du personnel obstétrical', 200000.00, 200000.00, 200000.00, '01', '01', '01', '03', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL
SELECT 
    gen_random_uuid(), '01.01.04', 'Salaires du personnel de prévention', 'Salaires du personnel de prévention', 150000.00, 150000.00, 150000.00, '01', '01', '01', '04', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id
UNION ALL
SELECT 
    gen_random_uuid(), '01.01.05', 'Salaires du personnel chirurgical', 'Salaires du personnel chirurgical', 100000.00, 100000.00, 100000.00, '01', '01', '01', '05', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id
UNION ALL
SELECT 
    gen_random_uuid(), '02.01.01', 'Achat de médicaments', 'Achat de médicaments essentiels', 200000.00, 200000.00, 200000.00, '02', '01', '01', '01', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id
UNION ALL
SELECT 
    gen_random_uuid(), '02.01.02', 'Achat de matériel médical', 'Achat de matériel et équipements médicaux', 100000.00, 100000.00, 100000.00, '02', '01', '01', '02', budget_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_id;

-- Insérer des correspondances d'activités d'exemple
WITH ligne_ids AS (
    SELECT 
        lb.id as ligne_id,
        lb.code as ligne_code
    FROM "lignes_budgetaires" lb
    WHERE lb."budgetId" = (SELECT "id" FROM "budgets" WHERE "code" = 'BUD-2024-001')
),
admin_id AS (
    SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1
)
INSERT INTO "correspondances_activites" (
    "id", "codeActivite", "nomActivite", "description", "categorie", "sousCategorie",
    "ligneBudgetaireId", "pourcentage", "montantMax", "priorite", "valide", "validePar", "valideLe", "createdAt", "updatedAt"
) 
SELECT 
    gen_random_uuid(), 'ACT-001', 'Consultations médicales générales', 'Consultations de médecine générale pour patients externes', 'SOINS_MEDICAUX', 'CONSULTATIONS', 
    ligne_ids.ligne_id, 25.00, 50000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '01.01.01'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-002', 'Soins infirmiers', 'Soins infirmiers et suivi des patients', 'SOINS_MEDICAUX', 'SOINS_INFIRMIERS', 
    ligne_ids.ligne_id, 30.00, 60000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '01.01.02'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-003', 'Accouchements', 'Accouchements et soins obstétricaux', 'SOINS_MEDICAUX', 'OBSTETRIQUE', 
    ligne_ids.ligne_id, 20.00, 40000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '01.01.03'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-004', 'Vaccinations', 'Campagnes de vaccination et immunisation', 'PREVENTION', 'VACCINATION', 
    ligne_ids.ligne_id, 15.00, 30000.00, 2, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '01.01.04'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-005', 'Chirurgie mineure', 'Interventions chirurgicales mineures', 'SOINS_MEDICAUX', 'CHIRURGIE', 
    ligne_ids.ligne_id, 10.00, 20000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '01.01.05'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-006', 'Achat de médicaments', 'Acquisition de médicaments essentiels', 'FONCTIONNEMENT', 'MEDICAMENTS', 
    ligne_ids.ligne_id, 40.00, 80000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '02.01.01'
UNION ALL
SELECT 
    gen_random_uuid(), 'ACT-007', 'Achat de matériel médical', 'Acquisition de matériel et équipements médicaux', 'FONCTIONNEMENT', 'MATERIEL_MEDICAL', 
    ligne_ids.ligne_id, 25.00, 50000.00, 1, true, admin_id.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ligne_ids, admin_id
WHERE ligne_ids.ligne_code = '02.01.02';

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables du Module 2 - Gestion Budgétaire créées avec succès !';
    RAISE NOTICE '📊 Tables créées : budgets, lignes_budgetaires, correspondances_activites';
    RAISE NOTICE '🔗 Relations configurées et données d''exemple insérées';
    RAISE NOTICE '💰 Budget d''exemple créé avec 7 lignes budgétaires et 7 correspondances d''activités';
END $$;






