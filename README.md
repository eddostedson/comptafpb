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

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommandé)

### 1. Cloner le projet

```bash
git clone <repo-url>
cd comptafpb
```

### 2. Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet (copier depuis `.env.example`) :

```bash
# PostgreSQL
DATABASE_URL="postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public"

# JWT
JWT_SECRET="cgcs_jwt_secret_change_in_production_2024"
JWT_EXPIRATION="24h"

# NextAuth
NEXTAUTH_URL="http://localhost:3975"
NEXTAUTH_SECRET="cgcs_nextauth_secret_change_in_production_2024"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 3. Démarrer avec Docker Compose

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

