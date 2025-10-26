# 🚀 Guide de déploiement CGCS

## 📋 Objectif
Mettre l'application CGCS en ligne et pouvoir travailler depuis plusieurs ordinateurs (maison + bureau).

---

## 🎯 ÉTAPE 1 : Mettre le code sur GitHub

### 1.1 Créer un compte GitHub (si pas déjà fait)
👉 https://github.com/signup

### 1.2 Créer un nouveau repository
1. Va sur https://github.com/new
2. Nom du repo : `comptafpb` ou `cgcs-app`
3. Description : "Application de Comptabilité de Gestion des Centres de Santé"
4. **Privé** (pour ne pas exposer ton code publiquement)
5. NE PAS initialiser avec README, .gitignore ou license (on a déjà tout)
6. Clique sur "Create repository"

### 1.3 Pousser ton code sur GitHub

Ouvre PowerShell dans le dossier `comptafpb` :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Module 1 Authentification complete"

# Lier au repository GitHub (remplace USERNAME par ton nom GitHub)
git remote add origin https://github.com/USERNAME/comptafpb.git

# Pousser le code
git branch -M main
git push -u origin main
```

✅ **Ton code est maintenant sur GitHub !**

---

## ☁️ ÉTAPE 2 : Déployer l'application en ligne

### Option A : Railway (RECOMMANDÉ - Simple et gratuit)

**Avantages** :
- ✅ PostgreSQL inclus
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS gratuit
- ✅ $5 de crédit gratuit/mois

**Étapes** :

1. **Créer un compte** : https://railway.app/
2. **Nouveau projet** : "New Project" → "Deploy from GitHub repo"
3. **Sélectionner** : `comptafpb`
4. **Railway détecte automatiquement** :
   - Backend (NestJS)
   - Frontend (Next.js)
   - PostgreSQL

5. **Configurer les variables d'environnement** :

**Pour le Backend** :
```
DATABASE_URL=<fourni par Railway>
JWT_SECRET=ton_secret_jwt_production
JWT_EXPIRATION=24h
PORT=3001
NODE_ENV=production
```

**Pour le Frontend** :
```
NEXT_PUBLIC_API_URL=https://ton-backend.railway.app/api
NEXTAUTH_URL=https://ton-frontend.railway.app
NEXTAUTH_SECRET=ton_secret_nextauth_production
```

6. **Déployer** : Railway déploie automatiquement !

7. **URLs obtenues** :
   - Backend : `https://ton-backend.railway.app`
   - Frontend : `https://ton-frontend.railway.app`
   - PostgreSQL : Accessible uniquement depuis Railway

---

### Option B : Vercel (Frontend) + Supabase (Backend + DB)

**Frontend sur Vercel** :
1. Compte : https://vercel.com/
2. Import depuis GitHub
3. Déploie automatiquement

**Backend + DB sur Supabase** :
1. Compte : https://supabase.com/
2. Nouveau projet
3. PostgreSQL + API automatique

---

### Option C : VPS (Contrôle total)

**Providers** :
- DigitalOcean ($5/mois)
- OVH (~3€/mois)
- Hetzner (~3€/mois)

**Installer Docker sur le VPS** :
```bash
# Même docker-compose.yml
# Accessible via IP publique ou domaine
```

---

## 🔄 ÉTAPE 3 : Workflow de développement

### 3.1 Sur ton PC de MAISON (actuel)

```bash
# Faire des modifications
# Tester en local : http://localhost:3975

# Commiter les changements
git add .
git commit -m "Description des changements"

# Pousser sur GitHub
git push

# Railway/Vercel déploie automatiquement !
```

### 3.2 Sur ton PC du BUREAU (nouveau)

**Première fois** :
```bash
# Cloner le projet depuis GitHub
cd C:\Users\ton-username\Desktop\
git clone https://github.com/USERNAME/comptafpb.git
cd comptafpb

# Créer le fichier .env avec tes configs
# (copier depuis ton PC de maison)

# Démarrer Docker
docker-compose up -d

# Initialiser la base de données locale
docker exec cgcs_backend npx prisma migrate dev
docker exec cgcs_backend npm run prisma:seed
```

**Ensuite, chaque jour** :
```bash
# Récupérer les dernières modifications
git pull

# Redémarrer si nécessaire
docker-compose restart
```

**Après avoir modifié du code** :
```bash
git add .
git commit -m "Description"
git push
```

---

## 🌐 Accès à l'application

### En LOCAL (développement)
```
🏠 Maison : http://localhost:3975
🏢 Bureau : http://localhost:3975
```

### En LIGNE (production)
```
🌐 Partout : https://ton-frontend.railway.app
```

---

## 🔐 Sécurité - Gérer les secrets

### NE JAMAIS mettre dans GitHub :
- ❌ Fichier `.env`
- ❌ Mots de passe
- ❌ Clés API

### À mettre dans GitHub :
- ✅ Code source
- ✅ Fichier `.env.example` (avec des valeurs d'exemple)

### Gérer les secrets :
1. **GitHub Secrets** (pour CI/CD)
2. **Railway/Vercel** : Variables d'environnement dans le dashboard
3. **Local** : Fichier `.env` (ignoré par Git)

---

## 📊 Architecture finale

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🏠 PC MAISON          🏢 PC BUREAU             │
│    ↓                      ↓                      │
│  Local Dev            Local Dev                 │
│  localhost:3975       localhost:3975            │
│                                                  │
│         ↓                     ↓                  │
│    git push              git pull                │
│         ↓                     ↑                  │
│         ↓───────→ 📦 GitHub ←─────               │
│                      │                           │
│                      ↓                           │
│            ☁️ Railway/Vercel                     │
│            (Déploiement auto)                    │
│                      │                           │
│              ┌───────┴───────┐                   │
│              ↓               ↓                   │
│         Backend          Frontend                │
│     (NestJS + DB)      (Next.js)                 │
│              ↓               ↓                   │
│   https://api.app   https://app.com             │
│                                                  │
│         Accessible de PARTOUT 🌐                │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## ✅ Checklist de déploiement

### Avant de déployer :
- [ ] Code testé en local
- [ ] Fichier `.env.example` créé
- [ ] `.gitignore` configuré
- [ ] README.md à jour
- [ ] Secrets retirés du code

### Déploiement :
- [ ] Code sur GitHub
- [ ] Railway/Vercel configuré
- [ ] Variables d'environnement définies
- [ ] Base de données migrée
- [ ] Seeds exécutés

### Tests en production :
- [ ] Frontend accessible
- [ ] Backend répond
- [ ] Login fonctionne
- [ ] Dashboards s'affichent

---

## 🆘 Aide

### Problèmes courants :

**1. "git push rejected"**
```bash
git pull --rebase
git push
```

**2. "Port déjà utilisé en local"**
```bash
docker-compose down
docker-compose up -d
```

**3. "Cannot connect to database en production"**
→ Vérifier DATABASE_URL dans Railway/Vercel

---

## 💡 Conseils

1. **Commit souvent** : Petits commits fréquents > gros commits rares
2. **Messages clairs** : "Ajout module budgets" > "update"
3. **Tester en local** avant de pusher
4. **Backup** : GitHub = backup automatique
5. **Branches** : Utiliser des branches pour les grosses features

---

## 🎓 Commandes Git essentielles

```bash
# Voir l'état
git status

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Changer de branche
git checkout main

# Fusionner une branche
git merge feature/nouvelle-fonctionnalite

# Annuler des modifications
git checkout -- fichier.ts

# Voir les différences
git diff
```

---

**🎉 Avec cette configuration, tu pourras développer depuis n'importe où !**

