# IMPORTANT: Needs the build command to be available for the run to work
# 
# IMPORTANT: Needs the following variables to be set
# 
# DOCKER => command to run for docker (docker or podman)
# COMPOSE => .compose file to start the services
# ENV_FILE => .env file used in the compose process


.PHONY: run
run: build ## Builds and runs the project's services or specific $SERVICE
	${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} up --build -d $(SERVICE)

.PHONY: clean
clean: clean_dist ## cleans dist directories and stops the current $COMPOSE services 
	@echo "Stopping and pruning docker resources (no images)"
	@${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} down --volumes --remove-orphans

.PHONY: clean_all
clean_all: clean_dist ## Cleans everything $DOCKER related, not only this project
	@echo "Stopping and pruning docker resources (with images)"
	@${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} down --rmi all --volumes --remove-orphans
	@${DOCKER} container prune -f
	@${DOCKER} system prune -a -f
	@${DOCKER} image prune -a -f
	@${DOCKER} volume prune -f

.PHONY: clean_dist
clean_dist: ## Remove all dist folders (with preview)
	@find . -type d -name "dist" -print
	@find . -type d -name "dist" -exec rm -rf {} +

.PHONY: logs
logs: ## Tails the docker $SERVICE logs
ifdef SERVICE
		${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} logs -f --tail=400 $(SERVICE)
else
		@echo "Please define SERVICE environment/make variable. Example:"
		@echo
		@echo "SERVICE=web make logs"
		@echo
		@echo "-- or --"
		@echo
		@echo "make logs SERVICE=web"
		@echo
endif

.PHONY: exec
exec: ## Executes into the docker $SERVICE pod
ifdef SERVICE
		${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} exec $(SERVICE) /bin/sh
else
		@echo "Please define SERVICE environment/make variable. Example:"
		@echo
		@echo "SERVICE=web make exec"
		@echo
		@echo "-- or --"
		@echo
		@echo "make exec SERVICE=web"
		@echo
endif

.PHONY: help
help: ## Runs the help command showing all make commands available
	@echo "Available commands:"
	@grep -h -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
