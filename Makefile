.PHONY: help init up down restart logs reset studio test

# Commandes Makefile pour CGCS

help: ## Afficher l'aide
	@echo "📚 Commandes disponibles :"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initialiser le projet (première fois)
	@chmod +x scripts/*.sh
	@./scripts/init.sh

up: ## Démarrer tous les services
	@docker-compose up -d
	@echo "✅ Services démarrés"

down: ## Arrêter tous les services
	@docker-compose down
	@echo "✅ Services arrêtés"

restart: ## Redémarrer tous les services
	@docker-compose restart
	@echo "✅ Services redémarrés"

logs: ## Afficher les logs (make logs service=backend)
	@docker-compose logs -f $(service)

reset: ## Réinitialiser la base de données
	@chmod +x scripts/reset.sh
	@./scripts/reset.sh

studio: ## Ouvrir Prisma Studio
	@chmod +x scripts/studio.sh
	@./scripts/studio.sh

test: ## Exécuter les tests
	@chmod +x scripts/test.sh
	@./scripts/test.sh

clean: ## Nettoyer (⚠️ supprime les volumes Docker)
	@docker-compose down -v
	@echo "✅ Nettoyage terminé"

status: ## Afficher le statut des services
	@docker-compose ps

shell-backend: ## Ouvrir un shell dans le container backend
	@docker exec -it cgcs_backend sh

shell-frontend: ## Ouvrir un shell dans le container frontend
	@docker exec -it cgcs_frontend sh

psql: ## Ouvrir PostgreSQL CLI
	@docker exec -it cgcs_postgres psql -U cgcs_user -d cgcs_db

