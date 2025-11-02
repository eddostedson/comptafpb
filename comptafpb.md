3️⃣ Démarre Docker Desktop
🐳 Ouvre Docker Desktop
⏳ Attends qu'il soit prêt (icône verte)

Vous pouvez maintenant démarrer l’application :
cd backend; pnpm start:dev  * pnpm dev:backend
cd backend pnpm prisma db push * pnpm prisma generate
cd frontend; pnpm dev       * pnpm dev:frontend

4️⃣ Lance l'application
dans cursor
cd C:\Users\rise\Desktop\CURSOR_PROJECTS\comptafpb
docker-compose up -d

5️⃣ Attends 20 secondes
⏰ Les 3 conteneurs démarrent…

6️⃣ Accède à l'application
🌐 http://localhost:3975
admin@cgcs.cg / admin123

docker restart 7c190c73b993 a612542907cf 38f89312d227
docker restart cgcs_frontend cgcs_backend cgcs_postgres

verifi si les conteneurs on demarré : docker ps --filter "id=7c190c73b993" --filter "id=a612542907cf" --filter "id=38f89312d227"

📊 Commandes utiles au quotidien :

# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer (si modification du code)
docker-compose restart

# Voir l'état
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter ET supprimer les données (⚠️ ATTENTION)
docker-compose down -v

######################################################################
🎯 Module 1 CREER : Authentification & Gestion des rôles 

Vue d'ensemble
Le Module 1 est la fondation de toute l'application CGCS. Il gère :
 * L'authentification des utilisateurs
 * Les rôles et permissions
 * La hiérarchie organisationnelle (Admin → Régisseur → Chef de centre)
 * La sécurité de base

🏗️ Architecture créée

1. Base de données PostgreSQL
Nous avons créé 4 tables principales :

Table régisseurs
- id (UUID)
- code (REG-001, REG-002...)
- nom, prenom
- email (unique)
- telephone
- region (Brazzaville, Pointe-Noire...)
- actif (boolean)

Table centres
- id (UUID)
- code (CS-0001, CS-0002...)
- nom
- adresse, commune, province, region
- telephone, email
- type (Public, Privé, Confessionnel)
- niveau (CS, CMA, Hôpital)
- regisseurId (lien vers le régisseur)
- actif (boolean)

Table users
- id (UUID)
- email (unique)
- password (hashé avec bcrypt)
- nom, prenom, telephone
- role (ADMIN, REGISSEUR, CHEF_CENTRE)
- statut (ACTIF, INACTIF, SUSPENDU)
- centreId (pour les chefs de centre)
- regisseurId (pour les chefs et régisseurs)
- lastLogin

Table audit_actions
- id (UUID)
- userId
- action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE...)
- entity (Budget, OP, User...)
- entityId
- description
- metadata (JSON)
- ipAddress, userAgent
- createdAt

2. Connexion (Login)
Endpoint : POST /api/auth/login
Ce qu'il fait :
Vérifie que l'email existe dans la base de données
Compare le mot de passe saisi avec le hash stocké (bcrypt)
Vérifie que le compte est ACTIF (pas INACTIF ou SUSPENDU)
Génère un JWT token valable 24h
Met à jour la date de dernière connexion (lastLogin)
Enregistre la connexion dans les logs d'audit
Page frontend : http://localhost:3975/login

3. Profil utilisateur
Endpoint : GET /api/auth/profile
Ce qu'il fait :
Récupère les informations complètes de l'utilisateur connecté
Inclut les données du centre et du régisseur associés
Nécessite un JWT token valide

👥 Gestion des rôles
3 rôles hiérarchiques

1. ADMIN (Administrateur central)
Nombre : 1-3 personnes
Accès : Vue nationale complète
Permissions :
Voir tous les centres (2500+)
Voir tous les régisseurs (150+)
Accès à tous les rapports consolidés
Gérer les utilisateurs
Superviser tout le système
Dashboard Admin :
Statistiques : 2,500 centres, 150 régisseurs
Vue d'ensemble nationale
Rapports consolidés

2. REGISSEUR (Superviseur régional)
Nombre : 150+ personnes
Accès : 20-25 centres assignés
Permissions :
Voir uniquement SES centres
Valider les budgets de ses centres
Valider les ordres de paiement (OP)
Consulter les rapports de ses centres
Pas accès aux autres régisseurs
Dashboard Régisseur :
Mes 23 centres supervisés
47 OP à valider
Budget consolidé de ses centres

3. CHEF_CENTRE (Chef de centre de santé)
Nombre : 2500+ personnes
Accès : Son centre uniquement
Permissions :
Gérer le budget de son centre
Créer des ordres de paiement
Consulter ses rapports
Pas accès aux autres centres
Dashboard Chef :
Solde disponible : 18,500 XAF
12 OP créés ce mois
4 OP en attente de validation

🔒 Sécurité implémentée
1. Hashage des mots de passe (bcrypt)
Avantages :
Impossible de retrouver le mot de passe original
Même mot de passe = hash différent (salt aléatoire)
Résistant aux attaques brute-force

2. JWT (JSON Web Tokens)

3. Guards (Protection des routes)
JwtAuthGuard

4. Audit Logs (Traçabilité)
Toutes les actions importantes sont enregistrées :
LOGIN / LOGOUT
CREATE (création de données)
UPDATE (modification)
DELETE (suppression)
VALIDATE / REJECT (validation d'OP, budgets...)

🎨 Interface utilisateur (Frontend)
Pages créées

1. Page de connexion (/login)
Formulaire email + mot de passe
Affichage des comptes de test
Validation côté client
Messages d'erreur clairs
Lien vers l'inscription

2. Page d'inscription (/register)
Formulaire complet (nom, prénom, email, password, téléphone)
Validation des champs
Redirection vers login après succès

3. Dashboard Admin (/dashboard)
Vue nationale
4 cartes de statistiques
Menu de navigation
Bouton déconnexion

4. Dashboard Régisseur (/dashboard)
Vue multi-centres
Statistiques de ses centres
OP en attente de validation

5. Dashboard Chef (/dashboard)
Vue de son centre
Solde et budget
Ses OP créés
Composants UI créés
Tous basés sur shadcn/ui :
Button : Boutons stylisés
Input : Champs de saisie
Label : Labels de formulaire
Card : Cartes d'information
Toast/Sonner : Notifications
Design :
Palette : Bleu (#4F7CFF) + Vert
Responsive : PC, tablette, mobile
Moderne et professionnel

📊 Données de test créées

Comptes utilisateurs :

Email	Mot de passe	Rôle	Description

admin@cgcs.cg	admin123	ADMIN	Administrateur central

regisseur1@cgcs.cg	regisseur123	REGISSEUR	Régisseur région Brazzaville

chef1@cgcs.cg	chef123	CHEF_CENTRE	Chef du centre CS-0001

Centres :
1 centre de test : "Centre de Santé Test" (CS-0001)

Régisseurs :
1 régisseur de test : REG-001 (région Brazzaville)

🔄 Flux d'authentification complet
1. Utilisateur ouvre http://localhost:3975
   ↓
2. Redirection automatique vers /login
   ↓
3. Saisie email + password
   ↓
4. Frontend envoie au backend via NextAuth
   ↓
5. Backend vérifie dans PostgreSQL
   ↓
6. bcrypt compare les passwords
   ↓
7. Backend génère JWT token
   ↓
8. Frontend stocke le token (session)
   ↓
9. Redirection vers /dashboard
   ↓
10. Dashboard affiche selon le rôle
    - ADMIN → Dashboard national
    - REGISSEUR → Dashboard multi-centres
    - CHEF_CENTRE → Dashboard du centre

⚙️ Technologies utilisées
Backend :
NestJS 10
Prisma ORM 5.22
PostgreSQL 16
JWT (JSON Web Tokens)
bcrypt (hashage passwords)
Passport.js (stratégies d'auth)
class-validator (validation)
Frontend :
Next.js 15 (App Router)
React 19
NextAuth.js 4.24
Tailwind CSS
shadcn/ui (composants)
Sonner (notifications)
Axios (API calls)
Infrastructure :
Docker Compose
3 conteneurs (PostgreSQL, Backend, Frontend)
Volumes persistants

##########################################################
Procédure pour ajouter une application sur GIT
* 1 se connecter a son compte et créer un nouveau repository
* 

