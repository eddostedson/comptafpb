# 🔄 Solution : Redémarrage Automatique du Backend

## ❓ Question Fréquente

**"Si je fais `pnpm dev`, est-ce que le backend redémarre automatiquement s'il s'arrête ?"**

## 📋 Réponse Détaillée

### ✅ OUI, mais avec des Limitations

**Avec `pnpm dev` :**

✅ **OUI** - Le backend redémarre automatiquement sur **modification de fichiers** (hot-reload)

❌ **NON** - Le backend **ne redémarre PAS automatiquement** en cas de :
- Crash du processus Node.js
- Erreur fatale non capturée
- Problème de connexion à la base de données
- Erreur TypeScript qui empêche la compilation

## 🎯 Solutions Selon Votre Besoin

### Solution 1 : `pnpm dev` (Développement Standard)

**Utilisation :**
```powershell
# Depuis la racine du projet
pnpm dev
```

**Comportement :**
- ✅ Démarre le backend et le frontend
- ✅ Redémarre automatiquement sur modification de fichiers
- ❌ **NE redémarre PAS** en cas de crash ou erreur fatale

**Idéal pour :** Développement quotidien normal

### Solution 2 : Script de Surveillance (Recommandé pour Développement Intensif)

**Utilisation :**
```powershell
# Dans un terminal séparé, depuis la racine du projet
.\start-backend-auto.ps1
```

**Ou directement :**
```powershell
cd backend
.\keep-alive.ps1
```

**Comportement :**
- ✅ Démarre le backend automatiquement
- ✅ **Redémarre automatiquement** en cas de crash
- ✅ Surveille en continu toutes les 10 secondes
- ✅ Gère les conflits de port
- ✅ Affiche des logs détaillés

**Idéal pour :** Développement intensif où le backend peut crash

### Solution 3 : PM2 (Production)

**Utilisation :**
```powershell
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Comportement :**
- ✅ Démarre le backend automatiquement
- ✅ **Redémarre automatiquement** en cas de crash
- ✅ Limite la mémoire utilisée
- ✅ Journalise les erreurs
- ✅ Démarré automatiquement au démarrage de Windows

**Idéal pour :** Production et environnement stable

## 🔧 Fonctionnement de `pnpm dev`

La commande `pnpm dev` utilise `concurrently` pour lancer :

1. **Frontend** : `cd frontend && pnpm dev`
   - Next.js en mode développement
   - Redémarre automatiquement sur modification de fichiers

2. **Backend** : `cd backend && pnpm start:dev`
   - NestJS en mode watch (`nest start --watch`)
   - Redémarre automatiquement sur modification de fichiers TypeScript
   - **Ne redémarre PAS** en cas d'erreur fatale ou crash

## 📊 Comparaison des Solutions

| Solution | Redémarrage sur Modification | Redémarrage sur Crash | Surveillance Continue |
|----------|------------------------------|----------------------|----------------------|
| `pnpm dev` | ✅ OUI | ❌ NON | ❌ NON |
| `keep-alive.ps1`` | ✅ OUI | ✅ OUI | ✅ OUI |
| PM2 | ✅ OUI | ✅ OUI | ✅ OUI |

## 🎯 Recommandation

### Pour le Développement Quotidien

**Utilisez :**
```powershell
pnpm dev
```

**Avantages :**
- Simple : une seule commande
- Démarre les deux services
- Hot-reload automatique sur modifications

**Limitations :**
- Si le backend crash, vous devez le redémarrer manuellement (Ctrl+C puis `pnpm dev` à nouveau)

### Pour le Développement Intensif

**Utilisez :**
```powershell
# Terminal 1 : Backend avec surveillance
cd backend
.\keep-alive.ps1

# Terminal 2 : Frontend
cd frontend
pnpm dev
```

**Ou utilisez le script automatique :**
```powershell
.\start-backend-auto.ps1
```

**Avantages :**
- Backend redémarre automatiquement s'il crash
- Surveillance continue
- Logs détaillés

## ⚠️ Réponse Directe à Votre Question

**"Si je fais `pnpm dev`, tout fonctionne et si pour diverses raisons le backend s'arrête, il sera redémarré automatiquement ?"**

### Réponse : **PARTIELLEMENT OUI**

**OUI** si le backend s'arrête à cause de :
- ✅ Modification de fichiers (redémarre automatiquement)
- ✅ Erreurs de compilation TypeScript corrigées (redémarre automatiquement)

**NON** si le backend s'arrête à cause de :
- ❌ Crash du processus Node.js (ne redémarre PAS automatiquement)
- ❌ Erreur fatale non capturée (ne redémarre PAS automatiquement)
- ❌ Problème de connexion à la base de données (ne redémarre PAS automatiquement)
- ❌ Arrêt manuel du processus (ne redémarre PAS automatiquement)

## 💡 Solution Définitive

**Pour garantir un redémarrage automatique en TOUTES circonstances :**

```powershell
# Option 1 : Script de surveillance (Recommandé)
cd backend
.\keep-alive.ps1

# Option 2 : PM2 (Production)
cd backend
pm2 start ecosystem.config.js
```

Ces solutions garantissent que le backend **redémarre automatiquement** même en cas de crash ou d'erreur fatale.


