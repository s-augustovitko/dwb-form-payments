.PHONY: all
all: run

include ./docker.mk

CHANGES_DIRS=admin/web/src admin/internal admin/cmd forms/api forms/web/src
COMPOSE=./local.compose.yaml
ENV_FILE=./.local.env
DOCKER=podman

MIGRATIONS_COMPOSE=./migrations.compose.yaml

.PHONY: run_migrations
run_migrations: ## Runs the database migrations
	@${DOCKER} compose -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} up --build

.PHONY: build
build: ## Build the front end
	@$(MAKE) -C admin build
	@$(MAKE) -C forms build

.PHONY: deps
deps: ## Installs necessary dependencies
	@$(MAKE) -C admin deps
	@$(MAKE) -C forms deps

