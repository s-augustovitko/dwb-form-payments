include ../docker.mk

.PHONY: all
all: run

COMPOSE="./compose.yaml"
DOCKER="podman"
ENV_FILE="../.env"

MIGRATIONS_COMPOSE="./migrations.compose.yaml"

.PHONY: build
build: clean_dist ## Build the front end
	@cd web && npm run build

.PHONY: deps
deps: ## Installs necessary dependencies
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go mod tidy
	@sqlc generate
	@gofmt -s -w .
	@goimports -w .
	@cd web && npm i

.PHONY: dev
dev: run ## Runs the project and watches for any changes
	@echo "Watching files and configs for changes..."
	@command -v inotifywait >/dev/null 2>&1 || { echo "Error: inotifywait not installed"; exit 1; }; \
	trap "echo 'Stopping dev watcher'; exit 0" INT; \
	while true; do \
		inotifywait -r -e modify,create,delete cmd pkg config web/src; \
		echo "Changes detected. Rebuilding..."; \
		$(MAKE) run; \
	done

.PHONY: run_migrations
run_migrations: ## Runs the database migrations
	${DOCKER} compose -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} up --build

