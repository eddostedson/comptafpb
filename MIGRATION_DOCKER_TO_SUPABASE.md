# 🔄 Guide de migration : Docker → Supabase

Ce guide vous montre comment migrer vos données existantes depuis Docker vers Supabase.

## 📋 Prérequis

- ✅ Un projet Supabase créé (voir [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
- ✅ L'URL de connexion Supabase
- ✅ Accès au conteneur Docker PostgreSQL (si vous avez des données à migrer)

---

## 🔄 Migration complète en 5 étapes

### Étape 1 : Sauvegarder les données Docker (si nécessaire)

Si vous avez déjà des données importantes dans votre base Docker :

```bash
# Exporter toutes les données
docker exec cgcs_postgres pg_dump -U cgcs_user -d cgcs_db --clean --if-exists > backup_docker.sql

# Vérifier que le backup existe
ls -lh backup_docker.sql
```

### Étape 2 : Configurer Supabase

1. **Créer un projet** sur https://supabase.com
2. **Attendre** que le projet soit créé (2-3 minutes)
3. **Récupérer l'URL** de connexion :
   - Settings → Database
   - Connection string → URI
   - Copier l'URL complète

### Étape 3 : Configurer le backend

**Créer/Modifier** `backend/.env` :

```env
# URL Supabase (remplacer avec votre vraie URL)
DATABASE_URL=postgresql://postgres.xxxxx:VOTRE_MOT_DE_PASSE@aws-0-xx-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Pour les migrations, utiliser la connection directe (plus stable)
# Créer un fichier backend/.env.migrations avec :
# DATABASE_URL=postgresql://postgres.xxxxx:VOTRE_MOT_DE_PASSE@aws-0-xx-region.pooler.supabase.com:5432/postgres

JWT_SECRET=cgcs_jwt_secret_change_in_production_2024
JWT_EXPIRATION=24h
PORT=3001
```

### Étape 4 : Appliquer les migrations Prisma

```bash
cd backend

# 1. Générer le client Prisma
npx prisma generate

# 2. Vérifier la connexion
npx prisma db pull

# 3. Appliquer toutes les migrations
npx prisma migrate deploy

# OU si vous voulez créer une nouvelle migration basée sur l'état actuel
npx prisma migrate dev --name init_supabase
```

### Étape 5 : Importer les données (si vous avez un backup)

#### Option A : Via Supabase Dashboard (le plus simple)

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Ouvrir le fichier `backup_docker.sql`
3. Supprimer les lignes `CREATE DATABASE` et `CREATE USER` (si présentes)
4. Exécuter le script SQL

#### Option B : Via psql (ligne de commande)

```bash
# Installer psql si nécessaire
# Windows : Inclus avec PostgreSQL
# macOS : brew install postgresql
# Linux : sudo apt install postgresql-client

# Importer
psql "votre-connection-string-supabase" < backup_docker.sql
```

#### Option C : Via Prisma Seed (recommandé pour données de test)

Si vous n'avez que des données de test, utilisez simplement le seed :

```bash
cd backend
pnpm run prisma:seed
```

---

## ✅ Vérification

### 1. Vérifier dans Supabase Dashboard

- Aller dans **Table Editor**
- Vous devriez voir toutes vos tables créées

### 2. Vérifier avec Prisma Studio

```bash
cd backend
npx prisma studio
```

Ouvre http://localhost:5555 - Vous devriez voir toutes vos données.

### 3. Tester l'application

```bash
# Terminal 1 - Backend
cd backend
pnpm run start:dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

Se connecter avec :
- Email : `admin@cgcs.cg`
- Password : `admin123`

---

## 🎯 Résultat

**Après la migration, vous avez :**

✅ **Toutes vos tables** créées dans Supabase  
✅ **Toutes vos données** importées (si backup)  
✅ **Même schéma** que Docker  
✅ **Même code** (backend/frontend)  
✅ **Même migrations Prisma**

**Aucune modification de code nécessaire !** 🎉

---

## 🔄 Retour à Docker (si nécessaire)

Si vous voulez revenir à Docker :

```bash
# 1. Exporter depuis Supabase
# Via Supabase Dashboard → SQL Editor → Export Database

# 2. Importer dans Docker
docker exec -i cgcs_postgres psql -U cgcs_user -d cgcs_db < backup_supabase.sql

# 3. Changer DATABASE_URL dans backend/.env
DATABASE_URL=postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public
```

---

## 📝 Notes importantes

### ⚠️ Connection Pooler vs Direct

- **Pooler** (`:6543`) : Pour les connexions applicatives (recommandé)
- **Direct** (`:5432`) : Pour les migrations Prisma (plus stable)

### ⚠️ Limites Supabase Gratuit

- **500 MB** de base de données
- **2 GB** de bande passante par mois
- **Pas de limite** de temps

Ces limites sont largement suffisantes pour le développement !

---

## 🚀 Avantages après migration

1. **✅ Plus besoin de Docker** pour PostgreSQL
2. **✅ Backup automatique** quotidien
3. **✅ Accessible partout** (cloud)
4. **✅ Interface graphique** intégrée
5. **✅ Prêt pour production** directement

---

## 🆘 Aide

Si vous rencontrez des problèmes :

1. Vérifier que l'URL Supabase est correcte
2. Vérifier que le mot de passe est correct
3. Vérifier que Supabase Dashboard → Database → Connection pooling est activé
4. Consulter [SUPABASE_SETUP.md](SUPABASE_SETUP.md) pour les détails



