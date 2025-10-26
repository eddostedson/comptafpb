#!/bin/bash

# Script de démarrage rapide pour CGCS
# Usage: ./scripts/start.sh

echo "🚀 Démarrage de CGCS..."
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou n'est pas démarré"
    echo "👉 Lance Docker Desktop et réessaye"
    exit 1
fi

# Démarrer les conteneurs
echo "🐳 Démarrage des conteneurs..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage (20 secondes)..."
sleep 20

# Vérifier l'état
echo ""
echo "📊 État des conteneurs:"
docker-compose ps

echo ""
echo "✅ CGCS est prêt !"
echo ""
echo "🌐 Accède à l'application:"
echo "   Frontend:  http://localhost:3975"
echo "   Backend:   http://localhost:3001"
echo "   Swagger:   http://localhost:3001/api/docs"
echo ""
echo "🔐 Comptes de test:"
echo "   Admin:      admin@cgcs.cg / admin123"
echo "   Régisseur:  regisseur1@cgcs.cg / regisseur123"
echo "   Chef:       chef1@cgcs.cg / chef123"

