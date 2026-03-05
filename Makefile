.PHONY: help dev dev-bg dev-stop prod prod-stop db-migrate db-seed db-forecast db-studio reseed
.DEFAULT_GOAL := help

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-16s %s\n", $$1, $$2}'

dev: ## Start development environment
	docker compose up

dev-bg: ## Start development environment in background
	docker compose up -d

dev-stop: ## Stop development environment
	docker compose down

prod: ## Start production environment
	NODE_ENV=production NODE_CONFIG_ENV=production docker compose --profile prod up

prod-stop: ## Stop production environment
	docker compose --profile prod down

db-migrate: ## Migrate database schema changes
	npx drizzle-kit migrate

db-seed: ## Seed database with initial data
	node db/seed.js

db-forecast: ## Update forecasts, e.g. make db-forecast or make db-forecast location=mission-bay
	node db/update-forecasts.js $(location)

db-studio: ## Open Drizzle Studio database UI
	npx drizzle-kit studio

reseed: db-seed ## Alias for db-seed
