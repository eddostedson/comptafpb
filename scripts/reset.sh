#!/bin/bash

# Script de réinitialisation de la base de données
# Usage: ./scripts/reset.sh

set -e

echo "⚠️  RÉINITIALISATION DE LA BASE DE DONNÉES"
echo ""
read -p "Êtes-vous sûr de vouloir réinitialiser la base de données ? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "🗄️ Réinitialisation en cours..."
docker exec -it cgcs_backend sh -c "npx prisma migrate reset --force && npm run prisma:seed"
echo ""
echo "✅ Base de données réinitialisée avec succès !"
echo ""
echo "🔐 Comptes de test disponibles :"
echo "   - Admin:      admin@cgcs.cg / admin123"
echo "   - Régisseur:  regisseur1@cgcs.cg / regisseur123"
echo "   - Chef:       chef1@cgcs.cg / chef123"

