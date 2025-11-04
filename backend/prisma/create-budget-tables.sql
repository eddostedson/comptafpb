-- Création des tables pour le Module 2 - Gestion Budgétaire
-- Correspondances d'activités aux lignes budgétaires

-- 1. Créer les enums
DO $$ BEGIN
    CREATE TYPE "TypeBudget" AS ENUM ('FONCTIONNEMENT', 'INVESTISSEMENT', 'RESSOURCES_HUMAINES', 'EQUIPEMENT', 'MAINTENANCE', 'FORMATION');
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
    "id" TEXT NOT NULL,
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
    "centreId" TEXT NOT NULL,
    "creePar" TEXT NOT NULL,
    "validePar" TEXT,
    "valideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- 3. Créer la table lignes_budgetaires
CREATE TABLE IF NOT EXISTS "lignes_budgetaires" (
    "id" TEXT NOT NULL,
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
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lignes_budgetaires_pkey" PRIMARY KEY ("id")
);

-- 4. Créer la table correspondances_activites
CREATE TABLE IF NOT EXISTS "correspondances_activites" (
    "id" TEXT NOT NULL,
    "codeActivite" TEXT NOT NULL,
    "nomActivite" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT,
    "sousCategorie" TEXT,
    "ligneBudgetaireId" TEXT NOT NULL,
    "pourcentage" DECIMAL(5,2),
    "montantMax" DECIMAL(15,2),
    "priorite" INTEGER NOT NULL DEFAULT 1,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "validePar" TEXT,
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
    'budget-example-001', 
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
) ON CONFLICT ("id") DO NOTHING;

-- Insérer des lignes budgétaires d'exemple
INSERT INTO "lignes_budgetaires" (
    "id", "code", "libelle", "description", "montantPrevu", "montantValide", "montantRestant",
    "chapitre", "section", "paragraphe", "article", "budgetId", "createdAt", "updatedAt"
) VALUES 
('ligne-001', '01.01.01', 'Salaires du personnel médical', 'Salaires du personnel médical', 250000.00, 250000.00, 250000.00, '01', '01', '01', '01', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-002', '01.01.02', 'Salaires du personnel infirmier', 'Salaires du personnel infirmier', 300000.00, 300000.00, 300000.00, '01', '01', '01', '02', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-003', '01.01.03', 'Salaires du personnel obstétrical', 'Salaires du personnel obstétrical', 200000.00, 200000.00, 200000.00, '01', '01', '01', '03', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-004', '01.01.04', 'Salaires du personnel de prévention', 'Salaires du personnel de prévention', 150000.00, 150000.00, 150000.00, '01', '01', '01', '04', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-005', '01.01.05', 'Salaires du personnel chirurgical', 'Salaires du personnel chirurgical', 100000.00, 100000.00, 100000.00, '01', '01', '01', '05', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-006', '02.01.01', 'Achat de médicaments', 'Achat de médicaments essentiels', 200000.00, 200000.00, 200000.00, '02', '01', '01', '01', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ligne-007', '02.01.02', 'Achat de matériel médical', 'Achat de matériel et équipements médicaux', 100000.00, 100000.00, 100000.00, '02', '01', '01', '02', 'budget-example-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Insérer des correspondances d'activités d'exemple
INSERT INTO "correspondances_activites" (
    "id", "codeActivite", "nomActivite", "description", "categorie", "sousCategorie",
    "ligneBudgetaireId", "pourcentage", "montantMax", "priorite", "valide", "validePar", "valideLe", "createdAt", "updatedAt"
) VALUES 
('corr-001', 'ACT-001', 'Consultations médicales générales', 'Consultations de médecine générale pour patients externes', 'SOINS_MEDICAUX', 'CONSULTATIONS', 'ligne-001', 25.00, 50000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-002', 'ACT-002', 'Soins infirmiers', 'Soins infirmiers et suivi des patients', 'SOINS_MEDICAUX', 'SOINS_INFIRMIERS', 'ligne-002', 30.00, 60000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-003', 'ACT-003', 'Accouchements', 'Accouchements et soins obstétricaux', 'SOINS_MEDICAUX', 'OBSTETRIQUE', 'ligne-003', 20.00, 40000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-004', 'ACT-004', 'Vaccinations', 'Campagnes de vaccination et immunisation', 'PREVENTION', 'VACCINATION', 'ligne-004', 15.00, 30000.00, 2, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-005', 'ACT-005', 'Chirurgie mineure', 'Interventions chirurgicales mineures', 'SOINS_MEDICAUX', 'CHIRURGIE', 'ligne-005', 10.00, 20000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-006', 'ACT-006', 'Achat de médicaments', 'Acquisition de médicaments essentiels', 'FONCTIONNEMENT', 'MEDICAMENTS', 'ligne-006', 40.00, 80000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('corr-007', 'ACT-007', 'Achat de matériel médical', 'Acquisition de matériel et équipements médicaux', 'FONCTIONNEMENT', 'MATERIEL_MEDICAL', 'ligne-007', 25.00, 50000.00, 1, true, (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables du Module 2 - Gestion Budgétaire créées avec succès !';
    RAISE NOTICE '📊 Tables créées : budgets, lignes_budgetaires, correspondances_activites';
    RAISE NOTICE '🔗 Relations configurées et données d''exemple insérées';
END $$;






