.PHONY: dev dev-bg dev-stop prod prod-stop

dev:
	docker compose up

dev-bg:
	docker compose up -d

dev-stop:
	docker compose down

prod:
	NODE_ENV=production NODE_CONFIG_ENV=production docker compose --profile prod up

prod-stop:
	docker compose --profile prod down
