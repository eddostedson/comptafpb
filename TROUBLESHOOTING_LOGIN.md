# 🔧 Guide de dépannage - Problème de connexion

> 💡 **Nouveau** : Pour un développement plus simple et stable, utilisez le [mode développement local sans Docker](DEVELOPPEMENT_LOCAL.md) !

## 🔍 Diagnostic rapide

### 1. Vérifier que le backend est démarré

```bash
# Vérifier si le backend répond
curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@cgcs.cg\",\"password\":\"admin123\"}"
```

### 2. Vérifier que la base de données est accessible

```bash
# Si vous utilisez Docker
docker-compose ps

# Vérifier les logs du backend
docker-compose logs backend

# Vérifier les logs de la base de données
docker-compose logs postgres
```

### 3. Vérifier les variables d'environnement

**Frontend** (`frontend/.env.local` ou `.env`) :
```env
NEXTAUTH_URL=http://localhost:3975
NEXTAUTH_SECRET=cgcs_nextauth_secret_change_in_production_2024
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend** (`backend/.env`) :
```env
DATABASE_URL=postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public
JWT_SECRET=cgcs_jwt_secret_change_in_production_2024
JWT_EXPIRATION=24h
```

### 4. Vérifier que les utilisateurs existent dans la base de données

```bash
# Entrer dans le container backend
docker exec -it cgcs_backend sh

# Lancer Prisma Studio
npx prisma studio

# Ou vérifier via psql
psql postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db -c "SELECT email, role FROM users WHERE email = 'admin@cgcs.cg';"
```

### 5. Recréer les données de test

```bash
# Dans le container backend
docker exec -it cgcs_backend sh

# Réinitialiser et seed la base de données
npx prisma migrate reset
npm run prisma:seed
```

## 🐛 Erreurs courantes

### "Identifiants invalides"
- **Cause** : L'utilisateur n'existe pas ou le mot de passe est incorrect
- **Solution** : Vérifier que l'utilisateur existe dans la base de données et utiliser le bon mot de passe

### "Cannot connect to backend"
- **Cause** : Le backend n'est pas démarré ou l'URL est incorrecte
- **Solution** : Vérifier que le backend tourne sur le port 3001 et que l'URL est correcte

### "Database connection error"
- **Cause** : La base de données n'est pas accessible
- **Solution** : Vérifier que PostgreSQL est démarré et que la DATABASE_URL est correcte

## ✅ Solutions rapides

### Réinitialiser complètement l'environnement

```bash
# Arrêter tous les services
docker-compose down

# Supprimer les volumes (⚠️ ATTENTION : supprime les données)
docker-compose down -v

# Redémarrer
docker-compose up -d

# Attendre que les services soient prêts
sleep 10

# Réinitialiser la base de données
docker exec -it cgcs_backend sh -c "npx prisma migrate reset && npm run prisma:seed"
```

### Vérifier que le backend fonctionne

```bash
# Tester l'endpoint de login directement
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cgcs.cg","password":"admin123"}'
```

Si cela fonctionne, le problème vient du frontend. Sinon, le problème vient du backend.

## 📝 Comptes de test par défaut

Après le seeding, ces comptes sont créés automatiquement :

- **Admin** : `admin@cgcs.cg` / `admin123`
- **Régisseur** : `regisseur1@cgcs.cg` / `regisseur123`
- **Chef de Centre** : `chef1@cgcs.cg` / `chef123`

## 🔗 Vérification manuelle

1. Ouvrir http://localhost:3001/api/docs (Swagger) pour vérifier que l'API fonctionne
2. Tester l'endpoint `/api/auth/login` directement depuis Swagger
3. Vérifier les logs du backend dans la console

