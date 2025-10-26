📘 PRD – Application de Comptabilité de Gestion des Centres de Santé (CGCS)
(Version 360° – multi-centres / multi-régisseurs / IA intégrée)
________________________________________
🧭 Aperçu du projet
CGCS (Comptabilité de Gestion des Centres de Santé) est une application web de gestion comptable, budgétaire et financière à grande échelle, destinée à plus de 2 500 centres de santé publics et privés.
Chaque Chef de centre gère le budget et les opérations comptables de son établissement, sous la supervision d’un Régisseur (150+ régisseurs nationaux), qui contrôle et valide les opérations d’environ 20 à 25 centres.
Un Administrateur central supervise la conformité, les rapports consolidés et la sécurité globale du système.
L’application couvre toute la chaîne de gestion :
Budgets → Dépenses → OP → Virements → Registres → Concordances bancaires → Rapports → IA de conformité.
________________________________________
🎯 Objectifs
1.	Digitaliser la gestion budgétaire et comptable des centres de santé.
2.	Garantir la traçabilité et la sécurité des opérations financières.
3.	Permettre une validation hiérarchique (Chef → Régisseur → Admin).
4.	Générer automatiquement les rapports comptables et financiers consolidés.
5.	Intégrer l’IA pour assister le contrôle, la vérification et la conformité des documents.
6.	Offrir une architecture scalable et performante, capable de gérer des milliers de centres et utilisateurs simultanément.
7.	Assurer la conformité aux normes comptables nationales et à la nomenclature budgétaire.
________________________________________
⚙️ Architecture technique (scalable et distribuée)
🧩 Structure 3-tier conteneurisée
1.	Frontend : Next.js 15 + React 19 + TypeScript
→ Interface utilisateur moderne, authentification, tableaux de bord, formulaires, export PDF/Excel.
2.	Backend : NestJS + TypeScript
→ Logique métier, API REST, gestion des rôles, sécurité, IA de conformité, génération de rapports.
3.	Base de données & Stockage : PostgreSQL + Supabase Storage
→ Données budgétaires, pièces justificatives, fichiers d’émission, rapports et index vectoriels IA.
Orchestration complète :
•	Docker Compose pour les services.
•	CI/CD via GitHub Actions.
•	Observabilité : Grafana Loki + Prometheus pour logs et métriques.
________________________________________
🧠 Scalabilité et Performance
•	2 500+ centres de santé gérés.
•	150+ régisseurs, chacun supervisant 20–25 centres.
•	10 000+ utilisateurs simultanés (multi-rôles).
•	Partitionnement logique par région / régisseur.
•	Optimisation : pagination, indexation, caching Redis, requêtes asynchrones.
•	Génération asynchrone des gros rapports consolidés (via jobs / queues).
•	Backup automatique PostgreSQL quotidien.
________________________________________
🧱 Organisation hiérarchique
Niveau	Rôle	Nombre estimé	Description
Administrateur central	1–3	Supervision totale, rapports nationaux, sécurité, IA.	
Régisseur	150+	Supervise 20–25 centres, valide budgets, OP, virements.	
Chef de centre	2 500+	Saisie et soumission de budgets, OP, pièces.	
Hiérarchie d’accès :
Admin → Régisseurs → Centres
Chaque utilisateur ne voit que les centres qui lui sont attribués.
________________________________________
🧩 Fonctionnalités principales
1.	Authentification & Rôles
o	NextAuth.js (email / mot de passe).
o	Rôles : Chef de centre, Régisseur, Administrateur.
o	RLS Supabase : filtrage strict par centreId et regisseurId.
2.	Gestion Budgétaire
o	Création de budgets prévisionnels (fonctionnement, investissement, ressources).
o	Suivi d’exécution, révision, validation hiérarchique.
o	Contrôles automatiques : totaux, cohérence, nomenclature.
o	Export PDF et Excel.
3.	Ordres de Paiement (OP)
o	Création d’ordres selon nature (fournisseur, mission, salaire).
o	Ajout de pièces justificatives.
o	Validation par le régisseur.
o	IA : détection de doublons, erreurs de montant, incohérences.
4.	Workflow de validation hiérarchique
o	Chef de centre → Régisseur → Admin.
o	Historisation complète des statuts et commentaires.
o	Notifications automatiques.
5.	Tableaux de bord multi-rôles
o	Chef : solde, dépenses, OP.
o	Régisseur : vue multi-centres, budgets consolidés.
o	Admin : vue globale, alertes IA, rapports consolidés.
6.	Rapports et États financiers
o	Situation financière, journal, grand livre, balance, aged payables.
o	Registres : banque, caisse, chèques, virements.
o	Consolidation par centre, régisseur, national.
o	Export PDF/Excel avec QR et signature électronique.
7.	Ordres de Virements (Fournisseurs & Personnel)
o	Création unitaire ou par lot (CSV/SEPA).
o	Vérification IBAN, solde, validation multiple.
o	Import de fichiers retour banque (statuts PAYÉ, REJETÉ, ÉCHEC).
o	Journal des virements, suivi du lot, traçabilité complète.
8.	Trésorerie & Registres numéraires
o	Registre de banque et de caisse.
o	Suivi des encaissements/décaissements.
o	Calcul solde courant.
o	Alerte si seuil dépassé / solde négatif.
9.	Concordance bancaire
o	Matching automatique Banque ↔ Système (ref + montant + libellé).
o	Score de concordance (0–100).
o	Statuts : aligné / incertain / non aligné.
o	Rapport PDF/Excel de synthèse et justification des écarts.
10.	Assistant IA Comptable
o	IA LangChain + Supabase Vector.
o	Vérifie la conformité, détecte anomalies, propose corrections.
o	Analyse des pièces PDF, OP et budgets.
o	Génère rapport IA avec justification réglementaire.
11.	PWA & Mode hors ligne
o	Consultation sans Internet.
o	Synchronisation automatique des données à la reconnexion.
________________________________________
💅 Interface Utilisateur
•	Framework UI : Tailwind CSS + shadcn/ui + Framer Motion.
•	Design : palette bleu/vert (santé, stabilité, confiance).
•	Layout : sidebar latérale + topbar adaptative.
•	Composants dynamiques : formulaires, tableaux, graphiques (Chart.js).
•	Notifications modernes : Sonner.
•	Responsive (PC, tablette, mobile).
________________________________________
🧠 Intelligence Artificielle intégrée
Domaine	Fonction IA
Budgets	Analyse des lignes et propositions d’ajustements.
OP & Pièces	Vérification cohérence montant / ligne budgétaire / article.
Signatures	Détection automatique de cachets, dates, signatures.
Comptabilité	Détection doublons, anomalies, erreurs d’imputation.
Rapports	Génération automatique de résumés IA et alertes de conformité.
Concordance	Matching intelligent des libellés bancaires.
Technologies IA :
•	LangChain (analyse de contexte).
•	Supabase Vector (indexation vectorielle).
•	OpenAI GPT API (raisonnement et génération de texte).
________________________________________
🧱 Données & Modèles clés (résumé)
•	User, Role, Centre, Regisseur
•	Budget, LigneBudgetaire
•	OrdrePaiement, PieceJustificative
•	Beneficiaire, Virement, VirementLot
•	CompteTresorerie, MouvementTresorerie, RapprochementBancaire
•	ConcordanceBancaire, ConcordanceItem
•	Rapport, AuditAction
________________________________________
📚 Technologies principales
Domaine	Outils
Frontend	Next.js 15, React 19, TypeScript
Backend	NestJS 10, TypeScript
Base de données	PostgreSQL 16
ORM	Prisma ORM
Stockage	Supabase Storage
Auth	NextAuth.js
IA	LangChain, Supabase Vector, OpenAI API
UI	Tailwind CSS, shadcn/ui, Framer Motion, Sonner
CI/CD	Docker Compose, GitHub Actions
Sécurité	JWT, bcrypt, Helmet, CSRF, CORS, Rate Limiter, Supabase RLS
Logs	Winston + Grafana Loki
Rapports	react-pdf, exceljs
________________________________________
📊 Scalabilité opérationnelle
Élément	Volume cible	Objectif de performance
Centres	2 500+	10 000+ opérations/jour
Régisseurs	150+	Supervision temps réel
OP mensuels	100 000+	Temps réponse < 3 s
Rapports	10 000/mois	Génération < 10 s
Pièces stockées	200 000+	99,99 % disponibilité
IA vectorielle	50 000 documents	Recherche < 1 s
________________________________________
✅ Critères de validation
•	Sécurité RLS et JWT opérationnelle.
•	Temps de réponse API < 300 ms (en charge).
•	Export PDF/Excel complet et paginé.
•	IA détecte au moins 3 anomalies types.
•	Concordance ≥ 90 % d’alignement.
•	Interface fluide et responsive.

