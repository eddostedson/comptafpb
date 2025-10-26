# 🚀 DÉPLOIEMENT CGCS SUR VPS HOSTINGER

## 📋 **PRÉREQUIS**
- ✅ VPS Hostinger avec Docker installé
- ✅ Nom de domaine configuré
- ✅ Accès SSH au VPS
- ✅ Ports 80, 443, 3000, 3001 ouverts

## 🎯 **ÉTAPES DE DÉPLOIEMENT**

### **1. Créer le Repository GitHub**
```bash
# Sur votre PC local
git remote add origin https://github.com/VOTRE_USERNAME/comptafpb.git
git push -u origin master
```

### **2. Se connecter au VPS Hostinger**
```bash
ssh root@VOTRE_IP_VPS
# ou
ssh root@VOTRE_DOMAINE.com
```

### **3. Cloner le projet sur le VPS**
```bash
cd /var/www
git clone https://github.com/VOTRE_USERNAME/comptafpb.git
cd comptafpb
```

### **4. Configurer les variables d'environnement**
```bash
# Créer le fichier .env sur le VPS
nano .env
```

**Contenu du .env pour production :**
```env
# Database
DATABASE_URL="postgresql://postgres:password123@postgres:5432/comptafpb"

# JWT
JWT_SECRET="votre-secret-jwt-super-securise-pour-production"

# NextAuth
NEXTAUTH_URL="https://VOTRE-DOMAINE.com"
NEXTAUTH_SECRET="votre-secret-nextauth-super-securise"

# Backend
BACKEND_URL="https://VOTRE-DOMAINE.com"
```

### **5. Démarrer l'application**
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs
```

### **6. Configurer le reverse proxy (Nginx)**
```bash
# Installer Nginx si pas déjà fait
apt update && apt install nginx -y

# Créer la configuration
nano /etc/nginx/sites-available/comptafpb
```

**Configuration Nginx :**
```nginx
server {
    listen 80;
    server_name VOTRE-DOMAINE.com www.VOTRE-DOMAINE.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name VOTRE-DOMAINE.com www.VOTRE-DOMAINE.com;

    # SSL (géré par Hostinger ou Let's Encrypt)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **7. Activer le site**
```bash
# Activer la configuration
ln -s /etc/nginx/sites-available/comptafpb /etc/nginx/sites-enabled/

# Tester la configuration
nginx -t

# Redémarrer Nginx
systemctl restart nginx
```

## 🔄 **MISE À JOUR AUTOMATIQUE**

### **Script de déploiement automatique**
```bash
# Créer le script
nano /var/www/comptafpb/deploy.sh
```

**Contenu du script :**
```bash
#!/bin/bash
cd /var/www/comptafpb
git pull origin master
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "✅ CGCS mis à jour avec succès !"
```

```bash
# Rendre exécutable
chmod +x deploy.sh
```

## 🛡️ **SÉCURITÉ**

### **Firewall**
```bash
# Configurer UFW
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### **Sauvegarde automatique**
```bash
# Script de sauvegarde quotidienne
nano /var/www/comptafpb/backup.sh
```

## 📊 **MONITORING**

### **Vérifier les logs**
```bash
# Logs de l'application
docker-compose logs -f

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **Statut des services**
```bash
# Vérifier que tout fonctionne
docker-compose ps
systemctl status nginx
```

## 🎯 **ACCÈS À L'APPLICATION**

Une fois déployé, votre application sera accessible à :
- **URL :** `https://VOTRE-DOMAINE.com`
- **Comptes de test :**
  - Admin : `admin@comptafpb.com` / `admin123`
  - Régisseur : `regisseur@comptafpb.com` / `regisseur123`
  - Chef : `chef@comptafpb.com` / `chef123`

## 🔧 **COMMANDES UTILES**

```bash
# Redémarrer l'application
docker-compose restart

# Voir les logs en temps réel
docker-compose logs -f

# Mettre à jour depuis GitHub
git pull && docker-compose up -d --build

# Sauvegarder la base de données
docker exec postgres pg_dump -U postgres comptafpb > backup.sql

# Restaurer la base de données
docker exec -i postgres psql -U postgres comptafpb < backup.sql
```

## 🆘 **DÉPANNAGE**

### **Problèmes courants :**
1. **Port déjà utilisé :** Changer les ports dans docker-compose.yml
2. **SSL non configuré :** Utiliser Let's Encrypt ou le SSL de Hostinger
3. **Base de données corrompue :** Restaurer depuis une sauvegarde
4. **Mémoire insuffisante :** Optimiser les images Docker

### **Support :**
- Logs : `docker-compose logs`
- Statut : `docker-compose ps`
- Ressources : `docker stats`
