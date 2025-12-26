.PHONY: dev dev-bg dev-stop prod prod-stop

dev:
	docker compose up --build

dev-bg:
	docker compose up --build -d

dev-stop:
	docker compose down

prod:
	TARGET=prod NODE_ENV=production docker compose --profile prod up --build

prod-stop:
	docker compose --profile prod down
