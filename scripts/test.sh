#!/bin/bash

# Script pour exécuter les tests
# Usage: ./scripts/test.sh

echo "🧪 Exécution des tests backend..."
docker exec -it cgcs_backend npm run test

echo ""
echo "✅ Tests terminés"

