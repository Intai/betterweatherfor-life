-include .env
export

.PHONY: help dev dev-bg dev-stop prod prod-bg prod-stop vrt vrt-bg vrt-stop vrt-creds vrt-reset dev-e2e dev-smoke prod-e2e k8s-prod-e2e db-migrate db-seed db-forecast db-studio reseed k8s-dev k8s-local k8s-local-stop k8s-push k8s-prod k8s-prod-stop k8s-db k8s-forecast-login k8s-forecast k8s-forecast-clean k8s-forecast-suspend tf-plan tf-apply
.DEFAULT_GOAL := help

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*## .*$$' Makefile | sed 's/:.*## /	/' | awk -F'\t' '{printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker compose up

dev-bg: ## Start development environment in background
	docker compose up -d

dev-stop: ## Stop development environment
	docker compose down

dev-e2e: dev-bg ## Run all Playwright e2e tests against development environment
	npm run test:e2e

dev-smoke: dev-bg ## Run @smoke e2e tests against development environment
	npm run test:e2e -- --grep @smoke

prod: ## Start production environment
	NODE_ENV=production NODE_CONFIG_ENV=production docker compose --profile prod up

# Rebuilds because the production stage bakes .next at build time, so compose reusing an
# existing image would serve a build from before the latest source change.
prod-bg: ## Start production environment in background
	NODE_ENV=production NODE_CONFIG_ENV=production docker compose --profile prod up -d --build

prod-stop: ## Stop production environment
	docker compose --profile prod down

prod-e2e: prod-bg ## Run @prod e2e tests against production environment
	BASE_URL=http://localhost PLAYWRIGHT_WEB_SERVER="make prod-bg" npm run test:e2e -- --grep @prod

vrt: ## Start visual regression tracker on port 8080
	docker compose -f docker-compose.vrt.yml up

vrt-bg: ## Start visual regression tracker in background
	docker compose -f docker-compose.vrt.yml up -d

vrt-stop: ## Stop visual regression tracker
	docker compose -f docker-compose.vrt.yml down

vrt-creds: ## Show the seeded visual regression tracker credentials
	docker compose -f docker-compose.vrt.yml logs vrt-migration

vrt-reset: ## Delete visual regression tracker data including baselines
	docker compose -f docker-compose.vrt.yml down -v

k8s-dev: ## Start local Kubernetes dev environment with file sync
	skaffold dev --cache-artifacts --auto-build=false

k8s-local: ## Deploy to local Kubernetes
	skaffold run --cache-artifacts

k8s-local-stop: ## Stop local Kubernetes deployment
	skaffold delete

k8s-push: ## Build and push Docker images to ghcr.io, e.g. make k8s-push target=web
ifneq ($(target),forecast)
	docker build -t ghcr.io/intai/betterweather-web:latest --target production --build-arg NODE_ENV=production --build-arg NODE_CONFIG_ENV=production --build-arg BUILD=$$(date +%s) --secret id=GOOGLE_MAPS_API_KEY,env=GOOGLE_MAPS_API_KEY .
	docker push ghcr.io/intai/betterweather-web:latest
endif
ifneq ($(target),web)
	docker build -f Dockerfile.forecast -t ghcr.io/intai/betterweather-forecast:latest .
	docker push ghcr.io/intai/betterweather-forecast:latest
endif

k8s-prod: ## Deploy to production Kubernetes, e.g. make k8s-prod target=docker
ifeq ($(target),docker)
	kubectl apply -f k8s/docker/do-block-storage-sc.yaml
endif
	kubectl apply -k k8s/production

k8s-prod-stop: ## Stop production Kubernetes deployment
	kubectl delete -k k8s/production
	-kubectl delete -f k8s/docker/do-block-storage-sc.yaml

k8s-prod-e2e: ## Run @prod e2e tests against the deployed production site
	BASE_URL=https://betterweatherfor.life PLAYWRIGHT_WEB_SERVER= \
		npm run test:e2e -- --grep @prod --grep-invert @purge-data

k8s-db: ## Port-forward K8s database to localhost:5432
	kubectl port-forward -n betterweather svc/db 5432:5432

k8s-forecast-login: ## Exec into a pod for Claude OAuth login
	kubectl run forecast-login -n betterweather --image=ghcr.io/intai/betterweather-forecast:latest --restart=Never \
		--overrides='{"spec":{"securityContext":{"fsGroup":1001},"containers":[{"name":"forecast-login","image":"ghcr.io/intai/betterweather-forecast:latest","args":["sleep","infinity"],"volumeMounts":[{"name":"claude-data","mountPath":"/home/pwuser/.claude"}]}],"volumes":[{"name":"claude-data","persistentVolumeClaim":{"claimName":"forecast-claude-pvc"}}]}}'
	kubectl wait --for=condition=ready pod/forecast-login -n betterweather --timeout=120s
	kubectl exec -it forecast-login -n betterweather -- claude
	kubectl exec forecast-login -n betterweather -- cp /home/pwuser/.claude.json /home/pwuser/.claude/.claude.json
	kubectl delete pod forecast-login -n betterweather

k8s-forecast: ## Manually trigger a forecast job, e.g. make k8s-forecast location=mission-bay
ifdef location
	kubectl create job --from=cronjob/forecast forecast-manual-$$(date +%s) -n betterweather \
		--dry-run=client -o json | jq '.spec.template.spec.containers[0].command = ["node", "db/update-forecasts.js", "$(location)"]' | kubectl apply -f -
else
	kubectl create job --from=cronjob/forecast forecast-manual-$$(date +%s) -n betterweather
endif

k8s-forecast-clean: ## Delete completed forecast jobs
	kubectl delete jobs -n betterweather --field-selector status.successful=1

k8s-forecast-suspend: ## Suspend the forecast cronjob, e.g. make k8s-forecast-suspend resume=true
ifeq ($(resume),true)
	kubectl patch cronjob forecast -n betterweather -p '{"spec":{"suspend":false}}'
else
	kubectl patch cronjob forecast -n betterweather -p '{"spec":{"suspend":true}}'
endif

db-migrate: ## Migrate database schema changes
	npx drizzle-kit migrate

db-seed: ## Seed database with initial data
	node db/seed.js

db-forecast: ## Update forecasts, e.g. make db-forecast or make db-forecast location=mission-bay
	node db/update-forecasts.js $(location)

db-studio: ## Open Drizzle Studio database UI
	npx drizzle-kit studio

tf-plan: ## Preview Terraform changes
	cd terraform && terraform plan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply

reseed: db-seed ## Alias for db-seed
