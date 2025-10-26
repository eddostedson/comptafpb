# 🚀 Guide de démarrage rapide CGCS

## 📦 Démarrage en 5 minutes

### 1. Prérequis
```bash
# Vérifier Node.js
node --version  # >= 20

# Vérifier Docker
docker --version
docker-compose --version
```

### 2. Cloner et installer
```bash
git clone <repo-url>
cd comptafpb
```

### 3. Configuration
Créer un fichier `.env` à la racine :
```env
DATABASE_URL="postgresql://cgcs_user:cgcs_password_2024@localhost:5432/cgcs_db?schema=public"
JWT_SECRET="cgcs_jwt_secret_change_in_production_2024"
NEXTAUTH_URL="http://localhost:3975"
NEXTAUTH_SECRET="cgcs_nextauth_secret_change_in_production_2024"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Démarrer l'application
```bash
# Démarrer tous les services
docker-compose up -d

# Attendre 30 secondes que tout démarre...

# Initialiser la base de données
docker exec -it cgcs_backend sh -c "npx prisma generate && npx prisma migrate dev --name init && npm run prisma:seed"
```

### 5. Accéder à l'application

🌐 **Frontend** : http://localhost:3975  
🔧 **API** : http://localhost:3001  
📚 **Swagger** : http://localhost:3001/api/docs

### 6. Se connecter

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@cgcs.cg | admin123 |
| Régisseur | regisseur1@cgcs.cg | regisseur123 |
| Chef | chef1@cgcs.cg | chef123 |

---

## 🔧 Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Arrêter tout
docker-compose down

# Tout supprimer (BDD incluse)
docker-compose down -v

# Ouvrir Prisma Studio
docker exec -it cgcs_backend npx prisma studio
```

---

## 🐛 Problèmes courants

### Le frontend ne se connecte pas au backend
```bash
# Vérifier que le backend est bien démarré
docker-compose logs backend

# Vérifier la variable d'environnement
echo $NEXT_PUBLIC_API_URL
```

### Erreur Prisma
```bash
# Régénérer Prisma Client
docker exec -it cgcs_backend npx prisma generate

# Réinitialiser la BDD (⚠️ perte de données)
docker exec -it cgcs_backend sh -c "npx prisma migrate reset --force && npm run prisma:seed"
```

### Port déjà utilisé
Modifier les ports dans `docker-compose.yml` :
- Frontend : `3975:3000` → `VOTRE_PORT:3000`
- Backend : `3001:3001` → `VOTRE_PORT:3001`

---

## ✅ Checklist de vérification

- [ ] Docker est démarré
- [ ] Fichier `.env` créé
- [ ] `docker-compose up -d` sans erreur
- [ ] Backend accessible : http://localhost:3001/api/docs
- [ ] Frontend accessible : http://localhost:3975
- [ ] Connexion réussie avec admin@cgcs.cg

---

**🎉 Vous êtes prêt à utiliser CGCS !**

Pour plus de détails, consultez `README.md`.

