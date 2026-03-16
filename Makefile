.PHONY: help dev dev-bg dev-stop prod prod-stop db-migrate db-seed db-forecast db-studio reseed k8s-local k8s-local-stop k8s-push k8s-prod k8s-prod-stop k8s-db
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

k8s-local: ## Deploy to local Kubernetes (localhost:30000)
	docker image inspect betterweather-web:latest >/dev/null 2>&1 || docker build -t betterweather-web:latest --target production --build-arg NODE_ENV=production --build-arg NODE_CONFIG_ENV=development --build-arg BUILD=1770282002 .
	kubectl apply -k k8s/local
	kubectl create secret generic web-secret --from-env-file=.env -n betterweather --dry-run=client -o yaml | kubectl apply -f -

k8s-local-stop: ## Stop local Kubernetes deployment
	kubectl delete -k k8s/local

k8s-push: ## Build and push Docker image to ghcr.io
	docker build -t ghcr.io/intai/betterweather-web:latest --target production --build-arg NODE_ENV=production --build-arg NODE_CONFIG_ENV=production --build-arg BUILD=$$(date +%s) .
	docker push ghcr.io/intai/betterweather-web:latest

k8s-prod: ## Deploy to production Kubernetes
	kubectl.docker apply -k k8s/production

k8s-prod-stop: ## Stop production Kubernetes deployment
	kubectl.docker delete -k k8s/production

k8s-db: ## Port-forward K8s database to localhost:5432
	kubectl port-forward -n betterweather svc/db 5432:5432

db-migrate: ## Migrate database schema changes
	npx drizzle-kit migrate

db-seed: ## Seed database with initial data
	node db/seed.js

db-forecast: ## Update forecasts, e.g. make db-forecast or make db-forecast location=mission-bay
	node db/update-forecasts.js $(location)

db-studio: ## Open Drizzle Studio database UI
	npx drizzle-kit studio

reseed: db-seed ## Alias for db-seed
