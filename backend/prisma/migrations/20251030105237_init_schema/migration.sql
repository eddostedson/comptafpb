-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'REGISSEUR', 'CHEF_CENTRE');

-- CreateEnum
CREATE TYPE "StatutUser" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "TypeBudget" AS ENUM ('FONCTIONNEMENT', 'INVESTISSEMENT', 'RESSOURCES_HUMAINES', 'EQUIPEMENT', 'MAINTENANCE', 'FORMATION');

-- CreateEnum
CREATE TYPE "StatutBudget" AS ENUM ('BROUILLON', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REJETE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'REJECT', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "RoleType" NOT NULL,
    "statut" "StatutUser" NOT NULL DEFAULT 'ACTIF',
    "centreId" TEXT,
    "regisseurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regisseurs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "region" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centres" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "regisseurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
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

-- CreateTable
CREATE TABLE "lignes_budgetaires" (
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

-- CreateTable
CREATE TABLE "correspondances_activites" (
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

-- CreateTable
CREATE TABLE "audit_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ActionType" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nbe_lines" (
    "id" TEXT NOT NULL,
    "ligne" TEXT,
    "libelle" TEXT NOT NULL,
    "objetDepense" TEXT,
    "categorie" TEXT NOT NULL,
    "sousCategorie" TEXT,
    "isHeader" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nbe_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_centreId_idx" ON "users"("centreId");

-- CreateIndex
CREATE INDEX "users_regisseurId_idx" ON "users"("regisseurId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "regisseurs_code_key" ON "regisseurs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "regisseurs_email_key" ON "regisseurs"("email");

-- CreateIndex
CREATE INDEX "regisseurs_code_idx" ON "regisseurs"("code");

-- CreateIndex
CREATE INDEX "regisseurs_region_idx" ON "regisseurs"("region");

-- CreateIndex
CREATE UNIQUE INDEX "centres_code_key" ON "centres"("code");

-- CreateIndex
CREATE INDEX "centres_code_idx" ON "centres"("code");

-- CreateIndex
CREATE INDEX "centres_regisseurId_idx" ON "centres"("regisseurId");

-- CreateIndex
CREATE INDEX "centres_region_idx" ON "centres"("region");

-- CreateIndex
CREATE INDEX "centres_type_idx" ON "centres"("type");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_code_key" ON "budgets"("code");

-- CreateIndex
CREATE INDEX "budgets_centreId_idx" ON "budgets"("centreId");

-- CreateIndex
CREATE INDEX "budgets_annee_idx" ON "budgets"("annee");

-- CreateIndex
CREATE INDEX "budgets_type_idx" ON "budgets"("type");

-- CreateIndex
CREATE INDEX "budgets_statut_idx" ON "budgets"("statut");

-- CreateIndex
CREATE INDEX "budgets_creePar_idx" ON "budgets"("creePar");

-- CreateIndex
CREATE INDEX "lignes_budgetaires_budgetId_idx" ON "lignes_budgetaires"("budgetId");

-- CreateIndex
CREATE INDEX "lignes_budgetaires_code_idx" ON "lignes_budgetaires"("code");

-- CreateIndex
CREATE INDEX "lignes_budgetaires_chapitre_section_paragraphe_article_idx" ON "lignes_budgetaires"("chapitre", "section", "paragraphe", "article");

-- CreateIndex
CREATE INDEX "correspondances_activites_codeActivite_idx" ON "correspondances_activites"("codeActivite");

-- CreateIndex
CREATE INDEX "correspondances_activites_ligneBudgetaireId_idx" ON "correspondances_activites"("ligneBudgetaireId");

-- CreateIndex
CREATE INDEX "correspondances_activites_categorie_idx" ON "correspondances_activites"("categorie");

-- CreateIndex
CREATE INDEX "correspondances_activites_valide_idx" ON "correspondances_activites"("valide");

-- CreateIndex
CREATE INDEX "audit_actions_userId_idx" ON "audit_actions"("userId");

-- CreateIndex
CREATE INDEX "audit_actions_action_idx" ON "audit_actions"("action");

-- CreateIndex
CREATE INDEX "audit_actions_entity_idx" ON "audit_actions"("entity");

-- CreateIndex
CREATE INDEX "audit_actions_createdAt_idx" ON "audit_actions"("createdAt");

-- CreateIndex
CREATE INDEX "nbe_lines_ligne_idx" ON "nbe_lines"("ligne");

-- CreateIndex
CREATE INDEX "nbe_lines_categorie_idx" ON "nbe_lines"("categorie");

-- CreateIndex
CREATE INDEX "nbe_lines_sousCategorie_idx" ON "nbe_lines"("sousCategorie");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_regisseurId_fkey" FOREIGN KEY ("regisseurId") REFERENCES "regisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centres" ADD CONSTRAINT "centres_regisseurId_fkey" FOREIGN KEY ("regisseurId") REFERENCES "regisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_budgetaires" ADD CONSTRAINT "lignes_budgetaires_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondances_activites" ADD CONSTRAINT "correspondances_activites_ligneBudgetaireId_fkey" FOREIGN KEY ("ligneBudgetaireId") REFERENCES "lignes_budgetaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_actions" ADD CONSTRAINT "audit_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
