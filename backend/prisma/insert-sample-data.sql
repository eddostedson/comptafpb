-- Insérer les lignes budgétaires manquantes
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
FROM budget_id
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

-- Insérer les correspondances d'activités
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

-- Afficher les statistiques
SELECT 
    'budgets' as table_name, COUNT(*) as count FROM "budgets"
UNION ALL
SELECT 
    'lignes_budgetaires' as table_name, COUNT(*) as count FROM "lignes_budgetaires"
UNION ALL
SELECT 
    'correspondances_activites' as table_name, COUNT(*) as count FROM "correspondances_activites";






