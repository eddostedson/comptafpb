# 🚀 Démarrage Rapide - CGCS

## 📋 Options de Démarrage

### Option 1 : Démarrage Automatique (Recommandé) ⭐

**Depuis la racine du projet :**

```powershell
.\start-backend-auto.ps1
```

Ce script :
- ✅ Vérifie si le backend est déjà démarré
- ✅ Installe les dépendances si nécessaire
- ✅ Vous permet de choisir entre mode simple ou surveillance
- ✅ Démarre automatiquement le backend

### Option 2 : Démarrage avec Surveillance Continue 🔄

**Pour garantir que le backend reste toujours en ligne :**

```powershell
cd backend
.\keep-alive.ps1
```

Ce script :
- ✅ Démarre le backend automatiquement
- ✅ Le redémarre s'il crash
- ✅ Surveille en continu son état
- ✅ Fonctionne en arrière-plan

### Option 3 : Démarrage Simple (Frontend + Backend) 🎯

**Pour démarrer les deux services ensemble :**

```powershell
pnpm dev
```

Cette commande démarre :
- ✅ Le backend sur le port 3001
- ✅ Le frontend sur le port 3975
- ✅ Avec hot-reload automatique

**Note :** Cette méthode ne redémarre pas automatiquement en cas d'erreur fatale.

### Option 4 : Démarrage Manuel (Recommandé pour le développement) 🛠️

**Dans deux terminaux séparés :**

**Terminal 1 - Backend :**
```powershell
cd backend
pnpm start:dev
```

**Terminal 2 - Frontend :**
```powershell
cd frontend
pnpm dev
```

## 🎯 Quelle Option Choisir ?

| Situation | Option Recommandée |
|-----------|-------------------|
| **Développement quotidien** | Option 3 : `pnpm dev` |
| **Développement intensif** | Option 2 : `keep-alive.ps1` |
| **Démarrage rapide** | Option 1 : `start-backend-auto.ps1` |
| **Débogage** | Option 4 : Terminaux séparés |

## ⚡ Après Redémarrage de Cursor

**Non, vous devez toujours redémarrer les services manuellement.**

Cependant, voici les solutions les plus simples :

### Solution Simple : 
```powershell
# Depuis la racine du projet
pnpm dev
```

### Solution Robuste :
```powershell
# Depuis la racine du projet
.\start-backend-auto.ps1
```

## 🔧 Configuration pour Démarrage Automatique (Optionnel)

### Windows Task Scheduler

Si vous voulez que le backend démarre automatiquement au démarrage de Windows :

1. Ouvrez "Planificateur de tâches" (Task Scheduler)
2. Créez une nouvelle tâche
3. Déclencheur : "Au démarrage" ou "À la connexion"
4. Action : Exécuter `start-backend-auto.ps1`
5. Utilisateur : Votre compte utilisateur

### Fichier de démarrage Windows

Ajoutez ceci à votre fichier de démarrage Windows :

```powershell
# Créer un fichier batch dans le dossier de démarrage
# C:\Users\VotreNom\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup

cd C:\Users\rise\Desktop\CURSOR_PROJECTS\comptafpb
powershell -WindowStyle Minimized -File .\start-backend-auto.ps1
```

## 📝 Checklist de Démarrage

Avant de commencer à travailler :

- [ ] Vérifier que le backend démarre : `cd backend && pnpm start:dev`
- [ ] Vérifier qu'il est accessible : Ouvrir `http://localhost:3001/api/docs`
- [ ] Si erreur, utiliser `keep-alive.ps1` pour voir les détails
- [ ] Pour le développement quotidien, utiliser `pnpm dev` depuis la racine

## 💡 Recommandation Finale

**Pour le développement quotidien :**

```powershell
# Depuis la racine du projet, une seule commande :
pnpm dev
```

Cette commande démarre automatiquement les deux services et vous n'avez plus à vous en préoccuper !






