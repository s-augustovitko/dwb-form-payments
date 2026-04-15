.PHONY: all
all: run

include ../docker.mk

CHANGES_DIRS=web/src internal cmd
COMPOSE=./compose.yaml
DOCKER=podman
ENV_FILE=../.env

.PHONY: build
build: ## Build the front end
	@cd web && npm run build

.PHONY: deps
deps: ## Installs necessary dependencies
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go mod tidy
	@rm -rf ./internal/database
	@sqlc generate
	@gofmt -s -w .
	@goimports -w .
	@cd web && npm i

