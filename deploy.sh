#!/bin/bash

# 🚀 Script de déploiement automatique pour VPS Hostinger
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de CGCS sur VPS Hostinger..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé !"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé !"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    print_error "Le fichier .env n'existe pas !"
    print_status "Créez le fichier .env avec les variables d'environnement de production"
    exit 1
fi

# Arrêter les conteneurs existants
print_status "Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Construire les nouvelles images
print_status "Construction des images Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
print_status "Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
print_status "Attente du démarrage des services..."
sleep 30

# Vérifier le statut des conteneurs
print_status "Vérification du statut des conteneurs..."
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs pour détecter les erreurs
print_status "Vérification des logs..."
if docker-compose -f docker-compose.prod.yml logs --tail=50 | grep -i error; then
    print_warning "Des erreurs ont été détectées dans les logs"
    print_status "Consultez les logs avec: docker-compose -f docker-compose.prod.yml logs"
else
    print_success "Aucune erreur détectée dans les logs"
fi

# Test de connectivité
print_status "Test de connectivité..."

# Test du backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend accessible sur le port 3001"
else
    print_warning "Backend non accessible sur le port 3001"
fi

# Test du frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend accessible sur le port 3000"
else
    print_warning "Frontend non accessible sur le port 3000"
fi

# Nettoyage des images inutilisées
print_status "Nettoyage des images Docker inutilisées..."
docker image prune -f

print_success "🎉 Déploiement terminé avec succès !"
print_status "Votre application CGCS est maintenant accessible sur votre VPS"
print_status "URL: https://VOTRE-DOMAINE.com"
print_status ""
print_status "Commandes utiles :"
print_status "  - Voir les logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "  - Redémarrer: docker-compose -f docker-compose.prod.yml restart"
print_status "  - Arrêter: docker-compose -f docker-compose.prod.yml down"
print_status "  - Statut: docker-compose -f docker-compose.prod.yml ps"
