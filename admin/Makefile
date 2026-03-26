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
	cd web && npm run dev

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
	${DOCKER} container prune -f
	${DOCKER} volume prune -f

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


