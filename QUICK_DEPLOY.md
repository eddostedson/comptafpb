# ⚡ DÉPLOIEMENT RAPIDE SUR VPS HOSTINGER

## 🎯 **ÉTAPES SIMPLES (5 minutes)**

### **1. Créer le repository GitHub**
1. Allez sur [GitHub.com](https://github.com)
2. Créez un nouveau repository : `comptafpb`
3. Copiez l'URL du repository

### **2. Pousser votre code sur GitHub**
```bash
# Dans votre dossier comptafpb
git remote add origin https://github.com/VOTRE_USERNAME/comptafpb.git
git push -u origin master
```

### **3. Se connecter à votre VPS Hostinger**
```bash
ssh root@VOTRE_IP_VPS
```

### **4. Cloner et déployer**
```bash
# Aller dans le dossier web
cd /var/www

# Cloner votre projet
git clone https://github.com/VOTRE_USERNAME/comptafpb.git
cd comptafpb

# Créer le fichier .env pour production
nano .env
```

**Contenu du .env :**
```env
DATABASE_URL="postgresql://postgres:password123@postgres:5432/comptafpb"
JWT_SECRET="votre-secret-jwt-super-securise-pour-production"
NEXTAUTH_URL="https://VOTRE-DOMAINE.com"
NEXTAUTH_SECRET="votre-secret-nextauth-super-securise"
BACKEND_URL="https://VOTRE-DOMAINE.com"
```

### **5. Démarrer l'application**
```bash
# Démarrer avec la configuration de production
docker-compose -f docker-compose.prod.yml up -d

# Vérifier que tout fonctionne
docker-compose -f docker-compose.prod.yml ps
```

### **6. Configurer Nginx (si pas déjà fait)**
```bash
# Installer Nginx
apt update && apt install nginx -y

# Créer la configuration
nano /etc/nginx/sites-available/comptafpb
```

**Configuration Nginx simple :**
```nginx
server {
    listen 80;
    server_name VOTRE-DOMAINE.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
ln -s /etc/nginx/sites-available/comptafpb /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🎉 **C'EST FINI !**

Votre application est maintenant accessible sur :
**https://VOTRE-DOMAINE.com**

### **Comptes de test :**
- **Admin :** `admin@comptafpb.com` / `admin123`
- **Régisseur :** `regisseur@comptafpb.com` / `regisseur123`
- **Chef :** `chef@comptafpb.com` / `chef123`

## 🔄 **MISE À JOUR AUTOMATIQUE**

Pour mettre à jour depuis votre PC :

```bash
# Sur votre PC
git add .
git commit -m "Mise à jour"
git push

# Sur le VPS
cd /var/www/comptafpb
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🛠️ **COMMANDES UTILES**

```bash
# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Redémarrer
docker-compose -f docker-compose.prod.yml restart

# Arrêter
docker-compose -f docker-compose.prod.yml down

# Statut
docker-compose -f docker-compose.prod.yml ps
```

## 🆘 **PROBLÈMES COURANTS**

1. **Port 80/443 occupé :** Vérifiez avec `netstat -tulpn | grep :80`
2. **SSL non configuré :** Utilisez Let's Encrypt ou le SSL de Hostinger
3. **Base de données :** Vérifiez avec `docker-compose logs postgres`

## 📞 **SUPPORT**

Si vous avez des problèmes :
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez le statut : `docker-compose ps`
3. Vérifiez les ports : `netstat -tulpn`
