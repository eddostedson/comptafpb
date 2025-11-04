#!/bin/bash
# Script de démarrage rapide pour développement local (Linux/Mac)
# Utilisation: ./start-dev.sh

echo "🚀 Démarrage de CGCS en mode développement local..."

# Vérifier si PostgreSQL Docker tourne
if docker ps --filter "name=cgcs_postgres" --format "{{.Names}}" | grep -q "cgcs_postgres"; then
    echo "✅ PostgreSQL est déjà démarré"
else
    echo "🐘 Démarrage de PostgreSQL Docker..."
    docker start cgcs_postgres 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Impossible de démarrer PostgreSQL. Créez d'abord le conteneur:"
        echo "   docker run --name cgcs_postgres -e POSTGRES_DB=cgcs_db -e POSTGRES_USER=cgcs_user -e POSTGRES_PASSWORD=cgcs_password_2024 -p 5432:5432 -d postgres:16-alpine"
        exit 1
    fi
    sleep 3
fi

# Démarrer le backend dans un nouveau terminal
echo "🔧 Démarrage du Backend..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd)/backend && echo '🔧 Backend CGCS' && pnpm run start:dev; exec bash"
elif command -v osascript &> /dev/null; then
    osascript -e "tell app \"Terminal\" to do script \"cd '$(pwd)/backend' && echo '🔧 Backend CGCS' && pnpm run start:dev\""
else
    echo "⚠️  Ouvrez un nouveau terminal et exécutez: cd backend && pnpm run start:dev"
fi

# Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend (10 secondes)..."
sleep 10

# Démarrer le frontend dans un nouveau terminal
echo "🎨 Démarrage du Frontend..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd)/frontend && echo '🎨 Frontend CGCS' && pnpm run dev; exec bash"
elif command -v osascript &> /dev/null; then
    osascript -e "tell app \"Terminal\" to do script \"cd '$(pwd)/frontend' && echo '🎨 Frontend CGCS' && pnpm run dev\""
else
    echo "⚠️  Ouvrez un nouveau terminal et exécutez: cd frontend && pnpm run dev"
fi

echo ""
echo "✅ Services démarrés !"
echo ""
echo "📍 URLs disponibles:"
echo "   - Frontend: http://localhost:3975"
echo "   - Backend API: http://localhost:3001"
echo "   - Swagger: http://localhost:3001/api/docs"
echo ""
echo "💡 Les services s'exécutent dans des terminaux séparés"
echo "💡 Appuyez sur Ctrl+C dans chaque terminal pour arrêter les services"



