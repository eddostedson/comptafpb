# 🏥 CGCS - Comptabilité de Gestion des Centres de Santé

Application web de gestion comptable, budgétaire et financière pour plus de 2 500 centres de santé.

## 📋 Module 1 : Authentification & Gestion des rôles

### ✅ Fonctionnalités implémentées

- ✅ Authentification complète (register, login, JWT)
- ✅ Gestion des rôles (Admin, Régisseur, Chef de Centre)
- ✅ Row Level Security (RLS) avec Prisma
- ✅ Tableaux de bord multi-rôles
- ✅ Base de données PostgreSQL
- ✅ 2500 centres, 150 régisseurs, 1 admin (seeds)

## 🛠️ Stack Technique

### Backend
- **NestJS 10** + TypeScript
- **Prisma ORM** + PostgreSQL 16
- **JWT** + bcrypt (sécurité)
- **Swagger** (documentation API)

### Frontend
- **Next.js 15** + React 19 + TypeScript
- **NextAuth.js** (authentification)
- **Tailwind CSS** + shadcn/ui
- **Sonner** (notifications)

### Infrastructure
- **Docker Compose** (orchestration)
- **PostgreSQL 16** (base de données)

## 🚀 Installation & Démarrage

> 💡 **Pour le développement quotidien**, nous recommandons le **[mode développement local sans Docker](DEVELOPPEMENT_LOCAL.md)** (plus simple, plus rapide, plus stable) !

### Prérequis

- Node.js 20+
- pnpm (recommandé)
- **Option A** : ⭐ **Supabase** (Recommandé - Le plus simple !) | **Option B** : PostgreSQL local | **Option C** : Docker (uniquement pour PostgreSQL)

> 💡 **Nouveau** : Utilisez **Supabase** pour la base de données ! C'est gratuit, hébergé, et ne nécessite aucune installation. Voir [SUPABASE_SETUP.md](SUPABASE_SETUP.md) pour la configuration.

### 🎯 Deux modes de démarrage

#### Option 1 : Développement Local (Recommandé) ⭐
Plus simple, plus rapide, plus stable pour le développement quotidien.

```bash
# Utiliser le script de démarrage automatique
.\start-dev.ps1      # Windows
./start-dev.sh       # Linux/Mac

# Ou manuellement :
# Terminal 1 - Backend
cd backend && pnpm install && pnpm run start:dev

# Terminal 2 - Frontend  
cd frontend && pnpm install && pnpm run dev
```

**Voir le guide complet** : [DEVELOPPEMENT_LOCAL.md](DEVELOPPEMENT_LOCAL.md)

#### Option 2 : Docker Compose (Production/CI)
Pour les tests d'intégration, la production, ou si vous préférez Docker.

### 1. Cloner le projet

```bash
git clone <repo-url>
cd comptafpb
```

### 2. Configuration des variables d'environnement

**Backend** (`backend/.env`) :
```env
# Option A : Supabase (Recommandé)
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-xx-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Option B : PostgreSQL local
# DATABASE_URL=postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public

JWT_SECRET=cgcs_jwt_secret_change_in_production_2024
JWT_EXPIRATION=24h
PORT=3001
```

> 📝 **Pour Supabase** : Récupérez votre URL de connexion dans Supabase Dashboard → Settings → Database → Connection string → URI

**Frontend** (`frontend/.env.local`) :
```env
NEXTAUTH_URL=http://localhost:3975
NEXTAUTH_SECRET=cgcs_nextauth_secret_change_in_production_2024
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Initialiser la base de données

```bash
# Backend
cd backend
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm run prisma:seed
```

### 4. Démarrer les services

**Option A : Script automatique (Recommandé)**
```bash
# Windows
.\start-dev.ps1

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

**Option B : Manuellement**
```bash
# Terminal 1 - Backend
cd backend
pnpm run start:dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

### 5. Accéder à l'application

- 🖥️ Frontend: http://localhost:3975
- 🔧 Backend API: http://localhost:3001
- 📚 Swagger docs: http://localhost:3001/api/docs

---

## 🐳 Démarrage avec Docker Compose (Alternative)

Si vous préférez Docker Compose pour tout :

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

**Services disponibles :**
- 🖥️ Frontend: http://localhost:3975
- 🔧 Backend API: http://localhost:3001
- 📚 Swagger docs: http://localhost:3001/api/docs
- 🗄️ PostgreSQL: localhost:5432

### 4. Initialiser la base de données

```bash
# Entrer dans le container backend
docker exec -it cgcs_backend sh

# Générer Prisma Client
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# Seed les données de test (2500 centres, 150 régisseurs)
npm run prisma:seed
```

## 👤 Comptes de test

Après le seeding, utilisez ces comptes :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@cgcs.cg | admin123 |
| **Régisseur** | regisseur1@cgcs.cg | regisseur123 |
| **Chef de Centre** | chef1@cgcs.cg | chef123 |

## 📁 Structure du projet

```
comptafpb/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Module authentification
│   │   ├── prisma/         # Service Prisma
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma de BDD
│   │   └── seed.ts         # Données de test
│   └── package.json
│
├── frontend/               # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/            # App Router
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/
│   │   ├── components/     # Composants UI
│   │   └── lib/            # Utilitaires
│   └── package.json
│
├── docker-compose.yml      # Orchestration
└── README.md
```

## 🧪 Tests

### Backend (NestJS)

```bash
cd backend

# Tests unitaires
npm run test

# Coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

## 🔐 Sécurité

- ✅ Mots de passe hashés avec **bcrypt** (10 rounds)
- ✅ JWT avec expiration (24h)
- ✅ Row Level Security (RLS) Prisma
- ✅ Helmet.js (headers sécurisés)
- ✅ CORS configuré
- ✅ Validation des DTOs avec class-validator
- ✅ Audit logs pour toutes les actions

## 📊 Données de test

Le script de seed crée :
- **150 régisseurs** (REG-001 à REG-150)
- **2500 centres** (CS-0001 à CS-2500)
- **1 administrateur central**
- **10 comptes régisseurs** pour les tests
- **20 comptes chefs de centre** pour les tests

Chaque régisseur supervise environ 20-25 centres.

## 🗺️ Prochaines étapes

### Module 2 : Gestion Budgétaire (à venir)
- Création de budgets
- Lignes budgétaires
- Validation hiérarchique
- Export PDF/Excel

### Module 3 : Ordres de Paiement (à venir)
- Création d'OP
- Pièces justificatives
- Workflow de validation

## 📖 Documentation API

Une fois le backend lancé, accédez à la documentation Swagger :

👉 http://localhost:3001/api/docs

## 🐛 Dépannage

### Problème : Base de données non accessible

```bash
# Vérifier que PostgreSQL est bien démarré
docker-compose ps

# Recréer le container
docker-compose down
docker-compose up -d postgres
```

### Problème : Prisma Client non généré

```bash
docker exec -it cgcs_backend npx prisma generate
```

### Problème : Port déjà utilisé

Modifier les ports dans `docker-compose.yml` si nécessaire.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence privée.

## 👥 Contact

Pour toute question, contactez l'équipe CGCS.

---

**Note** : Ce projet est en cours de développement actif. Le Module 1 (Authentification) est complet. Les modules suivants seront implémentés progressivement selon le planning défini dans `docs/prompt_master.md`.

