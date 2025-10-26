#!/bin/bash

# Script d'initialisation du projet CGCS
# Usage: ./scripts/init.sh

set -e

echo "🚀 Initialisation du projet CGCS..."
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"
echo ""

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé"
else
    echo "✅ Fichier .env existe déjà"
fi
echo ""

# Démarrer Docker Compose
echo "🐳 Démarrage de Docker Compose..."
docker-compose up -d
echo "✅ Services Docker démarrés"
echo ""

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL (30 secondes)..."
sleep 30
echo ""

# Initialiser la base de données
echo "🗄️ Initialisation de la base de données..."
docker exec -it cgcs_backend sh -c "npx prisma generate && npx prisma migrate dev --name init && npm run prisma:seed"
echo "✅ Base de données initialisée"
echo ""

echo "🎉 Initialisation terminée avec succès !"
echo ""
echo "📊 Services disponibles :"
echo "   - Frontend:     http://localhost:3975"
echo "   - Backend API:  http://localhost:3001"
echo "   - Swagger Docs: http://localhost:3001/api/docs"
echo ""
echo "🔐 Comptes de test :"
echo "   - Admin:      admin@cgcs.cg / admin123"
echo "   - Régisseur:  regisseur1@cgcs.cg / regisseur123"
echo "   - Chef:       chef1@cgcs.cg / chef123"
echo ""
echo "👉 Ouvrez http://localhost:3975 pour commencer !"

