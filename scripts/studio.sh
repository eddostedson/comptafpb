#!/bin/bash

# Script pour ouvrir Prisma Studio
# Usage: ./scripts/studio.sh

echo "🎨 Ouverture de Prisma Studio..."
echo "👉 Interface disponible sur: http://localhost:5555"
echo ""
docker exec -it cgcs_backend npx prisma studio

