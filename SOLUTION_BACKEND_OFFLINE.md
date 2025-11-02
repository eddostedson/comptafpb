# 🔧 Solution Définitive : Backend Offline

## 📋 Problèmes Identifiés

Le backend devient souvent offline pour plusieurs raisons :

1. **Erreurs TypeScript** qui empêchent la compilation
2. **Erreurs fatales** qui font crasher le processus Node.js
3. **Pas de redémarrage automatique** après un crash
4. **Erreurs de connexion à la base de données** non gérées
5. **Arrêt manuel** sans démarrage automatique
6. **Port déjà utilisé** par un autre processus

## ✅ Solutions Mises en Place

### 1. Gestion Robuste des Erreurs

Le fichier `backend/src/main.ts` a été amélioré pour :
- ✅ Gérer les erreurs non capturées (`uncaughtException`)
- ✅ Gérer les promesses rejetées (`unhandledRejection`)
- ✅ Gérer les signaux d'arrêt gracieux (`SIGTERM`, `SIGINT`)

### 2. Script de Surveillance Automatique

Un script PowerShell `backend/keep-alive.ps1` qui :
- ✅ Vérifie toutes les 10 secondes si le backend est en ligne
- ✅ Redémarre automatiquement le backend s'il est offline
- ✅ Gère les conflits de port
- ✅ Affiche des logs clairs

### 3. Configuration PM2 (Optionnel - pour production)

Fichier `backend/ecosystem.config.js` pour PM2 qui :
- ✅ Redémarre automatiquement en cas d'erreur
- ✅ Limite la mémoire utilisée
- ✅ Journalise les erreurs
- ✅ Gère plusieurs instances

## 🚀 Utilisation

### Solution Recommandée : Script de Surveillance

**Pour Windows :**

```powershell
cd backend
.\keep-alive.ps1
```

Ce script :
- ✅ Démarre le backend automatiquement
- ✅ Le redémarre s'il crash
- ✅ Surveille en continu son état
- ✅ Fonctionne en arrière-plan

**Avantages :**
- Simple à utiliser
- Pas besoin d'installer PM2
- Surveillance automatique
- Redémarrage automatique

### Alternative : PM2 (Production)

**Installation :**

```powershell
pnpm add -g pm2
```

**Démarrage :**

```powershell
cd backend
pm2 start ecosystem.config.js
```

**Commandes utiles :**

```powershell
# Voir les logs
pm2 logs cgcs-backend

# Voir le statut
pm2 status

# Arrêter
pm2 stop cgcs-backend

# Redémarrer
pm2 restart cgcs-backend

# Démarrer au démarrage de Windows
pm2 startup
pm2 save
```

### Solution Simple : Utiliser `pnpm dev`

**Depuis la racine du projet :**

```powershell
pnpm dev
```

Cette commande démarre automatiquement :
- ✅ Le backend (port 3001)
- ✅ Le frontend (port 3975)
- ✅ Avec hot-reload automatique

**Note :** Cette solution redémarre automatiquement lors des modifications de code, mais **ne redémarre pas automatiquement en cas d'erreur fatale**.

## 🛠️ Résolution des Problèmes Fréquents

### Problème : Erreur TypeScript

**Symptôme :** Le backend ne compile pas

**Solution :**
```powershell
cd backend
pnpm run type-check
# Corriger les erreurs TypeScript
```

### Problème : Port 3001 déjà utilisé

**Solution :**
```powershell
# Trouver le processus
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Arrêter le processus (remplacer <PID> par l'ID trouvé)
Stop-Process -Id <PID> -Force
```

### Problème : Erreur de connexion à la base de données

**Vérifications :**
1. Le fichier `backend/.env` existe
2. La variable `DATABASE_URL` est correcte
3. La base de données Supabase est accessible

**Test de connexion :**
```powershell
cd backend
pnpm prisma:studio
```

### Problème : Le backend crash au démarrage

**Solution :**
1. Vérifier les logs dans le terminal
2. Vérifier les erreurs TypeScript : `pnpm run type-check`
3. Vérifier les variables d'environnement dans `.env`
4. Utiliser le script `keep-alive.ps1` qui affichera les erreurs

## 📊 Recommandations

### Pour le Développement

✅ **Utiliser `pnpm dev`** depuis la racine du projet
- Simple et efficace
- Hot-reload automatique
- Démarre les deux services

### Pour la Production / Développement Intensif

✅ **Utiliser le script `keep-alive.ps1`**
- Surveillance continue
- Redémarrage automatique
- Logs détaillés

### Pour le Déploiement

✅ **Utiliser PM2**
- Production-ready
- Gestion des processus
- Monitoring avancé

## 🔄 Checklist de Démarrage

Avant de commencer à travailler :

- [ ] Vérifier que le backend démarre sans erreur : `cd backend && pnpm start:dev`
- [ ] Vérifier qu'il est accessible : Ouvrir `http://localhost:3001/api/docs`
- [ ] Si erreur, utiliser `keep-alive.ps1` pour voir les détails
- [ ] Pour le développement quotidien, utiliser `pnpm dev` depuis la racine

## 💡 Bonnes Pratiques

1. **Toujours vérifier les erreurs TypeScript** avant de commiter
2. **Utiliser le script de surveillance** pour le développement intensif
3. **Ne pas fermer le terminal** où tourne le backend sans raison
4. **Vérifier régulièrement** que le backend est accessible
5. **Utiliser PM2 en production** pour la stabilité

## 🎯 Solution Définitive Recommandée

### Pour le Développement Quotidien (Après Redémarrage de Cursor)

**Option Simple - Une seule commande :**

```powershell
# Depuis la racine du projet
pnpm dev
```

Cette commande démarre automatiquement :
- ✅ Le backend (port 3001)
- ✅ Le frontend (port 3975)
- ✅ Avec hot-reload

**⚠️ Important :** 
- Après avoir redémarré Cursor ou votre ordinateur, vous devez **toujours exécuter cette commande manuellement**
- `pnpm dev` utilise `concurrently` qui **ne redémarre PAS automatiquement** le backend s'il crash
- Le backend redémarre automatiquement seulement sur **modification de fichiers** (grâce à `nest start --watch`)
- Pour redémarrage automatique en cas de **crash ou erreur fatale**, utilisez le script `keep-alive.ps1`

### Pour une Surveillance Continue

**Option Robust - Script de surveillance (Recommandé pour développement intensif) :**

```powershell
# Option 1 : Script de surveillance (Recommandé)
cd backend
.\keep-alive.ps1

# Option 2 : Script automatique depuis la racine
pnpm start:auto
# ou
.\start-backend-auto.ps1
```

### Pour la Production

**Option PM2 :**

```powershell
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Ces solutions garantissent que le backend **redémarre automatiquement** en cas de crash ou d'erreur fatale.

## ⚠️ Réponse Directe : Après Redémarrage de Cursor

**NON, vous devez toujours redémarrer manuellement.**

**Solution la plus simple :**
```powershell
# Depuis la racine du projet
pnpm dev
```

Cette commande est la plus simple et démarre les deux services automatiquement !

