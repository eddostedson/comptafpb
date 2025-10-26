# 🎯 DÉMARREZ ICI - CGCS Module 1

## 🎉 Module 1 : Authentification & Gestion des rôles - TERMINÉ !

Bienvenue dans le projet **CGCS** (Comptabilité de Gestion des Centres de Santé).  
Le **Module 1** est complet et prêt à être testé !

---

## ⚡ Démarrage rapide (3 commandes)

```bash
# 1. Démarrer Docker Compose
docker-compose up -d

# 2. Attendre 30 secondes, puis initialiser la base de données
docker exec -it cgcs_backend sh -c "npx prisma generate && npx prisma migrate dev --name init && npm run prisma:seed"

# 3. Ouvrir l'application
# Frontend: http://localhost:3975
# Backend API: http://localhost:3001/api/docs
```

---

## 🔐 Se connecter

Utilisez l'un de ces comptes de test :

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| **👑 Admin** | `admin@cgcs.cg` | `admin123` | Vue nationale complète (2500 centres) |
| **👥 Régisseur** | `regisseur1@cgcs.cg` | `regisseur123` | Supervision de ~25 centres |
| **👤 Chef** | `chef1@cgcs.cg` | `chef123` | Gestion d'un centre |

---

## 📊 Ce qui a été créé

### Backend (NestJS + PostgreSQL)
- ✅ API REST complète (3 endpoints)
- ✅ Authentification JWT sécurisée
- ✅ Base de données avec 2500 centres, 150 régisseurs
- ✅ Prisma ORM + migrations
- ✅ Swagger documentation
- ✅ Tests unitaires

### Frontend (Next.js 15 + React 19)
- ✅ Pages Login, Register, Dashboard
- ✅ 3 dashboards spécifiques par rôle
- ✅ UI moderne avec Tailwind + shadcn/ui
- ✅ Responsive design
- ✅ Notifications en temps réel

### Infrastructure
- ✅ Docker Compose (3 services)
- ✅ Hot reload pour développement
- ✅ Variables d'environnement configurées

---

## 🌐 URLs importantes

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3975 | Interface utilisateur |
| **Backend API** | http://localhost:3001 | API REST |
| **Swagger Docs** | http://localhost:3001/api/docs | Documentation API interactive |
| **PostgreSQL** | localhost:5432 | Base de données |

---

## 📂 Structure du projet

```
comptafpb/
├── backend/           # NestJS API
│   ├── src/auth/      # Module authentification
│   ├── prisma/        # Schéma + seeds
│   └── package.json
├── frontend/          # Next.js App
│   ├── src/app/       # Pages (login, register, dashboard)
│   ├── src/components/# Composants UI
│   └── package.json
├── docker-compose.yml # Orchestration
├── README.md          # Documentation complète
├── QUICK_START.md     # Guide de démarrage
└── START_HERE.md      # Ce fichier
```

---

## 🧪 Tester l'application

### 1. Se connecter en tant qu'Admin
```
1. Ouvrir http://localhost:3975
2. Email: admin@cgcs.cg
3. Password: admin123
4. → Dashboard Admin avec stats nationales
```

### 2. Se connecter en tant que Régisseur
```
1. Ouvrir http://localhost:3975
2. Email: regisseur1@cgcs.cg
3. Password: regisseur123
4. → Dashboard Régisseur avec multi-centres
```

### 3. Se connecter en tant que Chef
```
1. Ouvrir http://localhost:3975
2. Email: chef1@cgcs.cg
3. Password: chef123
4. → Dashboard Chef avec gestion du centre
```

---

## 🔧 Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Arrêter tout
docker-compose down

# Ouvrir Prisma Studio (interface BDD)
docker exec -it cgcs_backend npx prisma studio
# → http://localhost:5555

# Réinitialiser la base de données
docker exec -it cgcs_backend sh -c "npx prisma migrate reset --force && npm run prisma:seed"
```

---

## 📚 Documentation détaillée

- **README.md** : Documentation complète du projet
- **QUICK_START.md** : Guide de démarrage en 5 minutes
- **backend/README.md** : Documentation API backend
- **frontend/README.md** : Documentation frontend
- **docs/MODULE_1_COMPLETE.md** : Récapitulatif du Module 1

---

## 🐛 Problèmes courants

### Le frontend ne démarre pas
```bash
# Solution 1 : Vérifier les logs
docker-compose logs frontend

# Solution 2 : Redémarrer
docker-compose restart frontend
```

### La base de données n'est pas accessible
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps

# Recréer le container
docker-compose down
docker-compose up -d postgres
```

### Erreur Prisma Client
```bash
# Régénérer Prisma Client
docker exec -it cgcs_backend npx prisma generate
```

---

## 🎯 Prochaines étapes

Le Module 1 est terminé ! Voici ce qui suit :

### Module 2 : Gestion Budgétaire (à venir)
- Création et gestion de budgets
- Lignes budgétaires
- Validation hiérarchique
- Export PDF/Excel

### Module 3 : Ordres de Paiement (à venir)
- Création d'ordres de paiement
- Upload de pièces justificatives
- Workflow de validation

---

## ✅ Checklist de vérification

Avant de commencer, vérifiez :

- [ ] Docker est installé et démarré
- [ ] Le port 3975 est libre (frontend)
- [ ] Le port 3001 est libre (backend)
- [ ] Le port 5432 est libre (PostgreSQL)
- [ ] `docker-compose up -d` s'exécute sans erreur
- [ ] Les migrations Prisma sont appliquées
- [ ] Le seed est exécuté (2500 centres créés)

---

## 🆘 Besoin d'aide ?

1. Consultez les logs : `docker-compose logs -f`
2. Lisez la documentation complète : `README.md`
3. Vérifiez les variables d'environnement : `.env`

---

## 🎉 Félicitations !

Vous êtes prêt à utiliser CGCS Module 1 !

**Bon développement ! 🚀**

---

**Version** : 1.0.0  
**Module** : 1 (Authentification & Gestion des rôles)  
**Statut** : ✅ Complet

