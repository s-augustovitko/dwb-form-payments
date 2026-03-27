.PHONY: all
all: run

COMPOSE="./compose.yaml"
MIGRATIONS_COMPOSE="./migrations.compose.yaml"
ENV_FILE="../.env"
DOCKER="podman"

.PHONY: test
test:
	go test ./...

.PHONY: deps
deps:
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go mod tidy
	sqlc generate
	gofmt -s -w .
	goimports -w .

.PHONY: run
run:
	cd web && npm i && npm run build
	${DOCKER} compose -f ${COMPOSE} --env-file ${ENV_FILE} up --build -d $(SERVICE)

.PHONY: dev
dev: run
	@echo "Watching files and configs for changes..."
	@command -v inotifywait >/dev/null 2>&1 || { echo "Error: inotifywait not installed"; exit 1; }; \
	trap "echo 'Stopping dev watcher'; exit 0" INT; \
	while true; do \
		inotifywait -r -e modify,create,delete cmd pkg config web/src; \
		echo "Changes detected. Rebuilding..."; \
		$(MAKE) run; \
	done

.PHONY: run_migrations
run_migrations:
	${DOCKER} compose -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} up --build

.PHONY: stop
stop:
	@echo "Stopping application..."
	${DOCKER} compose -f ${COMPOSE} -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} down

.PHONY: clean
clean:
	@echo "Stopping and pruning docker resources (no images)"
	${DOCKER} compose -f ${COMPOSE} -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} down --volumes --remove-orphans

.PHONY: clean_all
clean_all:
	@echo "Stopping and pruning docker resources (with images)"
	${DOCKER} compose -f ${COMPOSE} -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} down --rmi all --volumes --remove-orphans
	${DOCKER} container prune -f
	${DOCKER} system prune -a -f
	${DOCKER} image prune -a -f
	${DOCKER} volume prune -f

# Tails an docker services logs.
.PHONY: logs
logs:
ifdef SERVICE
		${DOCKER} compose -f ${COMPOSE} -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} logs -f --tail=400 $(SERVICE)
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

# Execs into running container.
.PHONY: exec
exec:
ifdef SERVICE
		${DOCKER} compose -f ${COMPOSE} -f ${MIGRATIONS_COMPOSE} --env-file ${ENV_FILE} exec $(SERVICE) /bin/sh
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


