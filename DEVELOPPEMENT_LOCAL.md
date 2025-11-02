# 🚀 Développement Local Simplifié (Sans Docker)

## 📋 Pourquoi cette approche ?

Docker est excellent pour la **production**, mais pour le **développement local**, cela peut être :
- ❌ Trop complexe (3 conteneurs à gérer)
- ❌ Instable (redémarrages fréquents)
- ❌ Lent (temps de build)
- ❌ Difficile à déboguer

## ✅ Solution : Développement local direct

Cette approche est **plus simple**, **plus rapide** et **plus stable** pour développer.

---

## 🔧 Prérequis

**Choisissez UNE des options suivantes :**

1. **⭐ Option A : Supabase (Recommandé - Le plus simple !)**
   - Créer un compte gratuit sur https://supabase.com
   - Aucune installation nécessaire
   - Voir [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

2. **Option B : PostgreSQL local**
   - Installer PostgreSQL 16 localement
   - Windows : https://www.postgresql.org/download/windows/
   - macOS : `brew install postgresql@16`
   - Linux : `sudo apt install postgresql-16`

3. **Option C : Docker (uniquement pour PostgreSQL)**
   - Docker installé
   - Uniquement le conteneur PostgreSQL

**Autres prérequis :**
- **Node.js 20+** installé
- **pnpm** installé (`npm install -g pnpm`)

---

## 🚀 Installation rapide

### 1. Installer PostgreSQL (si pas déjà fait)

**Option A : Docker uniquement pour PostgreSQL**
```bash
docker run --name cgcs_postgres -e POSTGRES_DB=cgcs_db -e POSTGRES_USER=cgcs_user -e POSTGRES_PASSWORD=cgcs_password_2024 -p 5432:5432 -d postgres:16-alpine
```

**Option B : PostgreSQL local**
- Windows : Télécharger depuis https://www.postgresql.org/download/windows/
- macOS : `brew install postgresql@16`
- Linux : `sudo apt install postgresql-16`

### 2. Configurer la base de données

```bash
# Créer la base de données (si PostgreSQL local)
createdb -U postgres cgcs_db

# Ou se connecter et créer manuellement
psql -U postgres
CREATE DATABASE cgcs_db;
CREATE USER cgcs_user WITH PASSWORD 'cgcs_password_2024';
GRANT ALL PRIVILEGES ON DATABASE cgcs_db TO cgcs_user;
\q
```

### 3. Configurer les variables d'environnement

**Backend** (`backend/.env`) :
```env
DATABASE_URL=postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public
JWT_SECRET=cgcs_jwt_secret_change_in_production_2024
JWT_EXPIRATION=24h
PORT=3001
```

**Frontend** (`frontend/.env.local`) :
```env
NEXTAUTH_URL=http://localhost:3975
NEXTAUTH_SECRET=cgcs_nextauth_secret_change_in_production_2024
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Installer les dépendances

```bash
# Backend
cd backend
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm run prisma:seed

# Frontend
cd ../frontend
pnpm install
```

### 5. Démarrer les services

**Terminal 1 - Backend :**
```bash
cd backend
pnpm run start:dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
pnpm run dev
```

---

## 📝 Scripts de démarrage rapide

Créer ces scripts pour simplifier le démarrage :

### Windows (`start-dev.ps1`)
```powershell
# Démarrer PostgreSQL (si Docker)
Start-Process docker -ArgumentList "start cgcs_postgres"

# Démarrer Backend (nouveau terminal)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; pnpm run start:dev"

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Démarrer Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm run dev"
```

### Linux/Mac (`start-dev.sh`)
```bash
#!/bin/bash

# Démarrer PostgreSQL (si Docker)
docker start cgcs_postgres

# Démarrer Backend (nouveau terminal)
gnome-terminal -- bash -c "cd backend && pnpm run start:dev; exec bash"

# Attendre 5 secondes
sleep 5

# Démarrer Frontend
gnome-terminal -- bash -c "cd frontend && pnpm run dev; exec bash"
```

---

## ✅ Avantages de cette approche

1. **Plus simple** : Pas besoin de gérer Docker Compose
2. **Plus rapide** : Pas de build Docker, démarrage instantané
3. **Plus stable** : Pas de problèmes de networking Docker
4. **Plus facile à déboguer** : Logs directs, pas dans les conteneurs
5. **Hot reload** : Fonctionne mieux sans Docker

---

## 🔄 Quand utiliser Docker vs Local

| Situation | Utiliser |
|-----------|----------|
| **Développement quotidien** | ⭐ **Local** (plus simple) |
| **Tests d'intégration** | Docker Compose |
| **Production** | Docker Compose |
| **CI/CD** | Docker Compose |
| **Démo/Présentation** | Docker Compose |

---

## 🐛 Dépannage

### Problème : PostgreSQL non accessible
```bash
# Vérifier que PostgreSQL tourne
pg_isready -h localhost -p 5432

# Si Docker, vérifier le conteneur
docker ps | grep postgres
```

### Problème : Port 3001 déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :3001

# Tuer le processus (Windows)
taskkill /PID <PID> /F
```

### Problème : Migrations Prisma échouent
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
pnpm run prisma:seed
```

---

## 📚 Commandes utiles

```bash
# Réinitialiser la base de données
cd backend
npx prisma migrate reset
pnpm run prisma:seed

# Ouvrir Prisma Studio (interface graphique)
cd backend
npx prisma studio

# Voir les logs backend en temps réel
# (dans le terminal où vous avez lancé pnpm run start:dev)
```

---

## 🎯 Prochaines étapes

1. Utiliser cette configuration pour le développement quotidien
2. Garder Docker Compose pour les tests et la production
3. Créer des scripts de démarrage automatique (voir ci-dessus)

Cette approche vous fera gagner beaucoup de temps ! ⚡

