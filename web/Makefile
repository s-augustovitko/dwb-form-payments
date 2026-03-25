# -------------------------
# Configuration
# -------------------------
API_DIR = api
WEB_DIR = web
DIST_DIR = dist
WEB_DIST_DIR := ${WEB_DIR}/dist

FTP_ENV_FILE = ./.ftp.env

COMPOSE="./docker/compose.yaml"
DOCKER="podman"

all: run

.PHONY: run
run: build
	${DOCKER} compose -f ${COMPOSE} up --build -d $(SERVICE)

# -------------------------
# Build project
# -------------------------
.PHONY: build
build: clean_dist
	@echo "Building project into ${DIST_DIR}..."
	@set -e; \
	# Check npm installed
	command -v npm >/dev/null 2>&1 || { echo "Error: npm not installed"; exit 1; }; \
	\
	# Build frontend
	echo "Building SolidJS frontend..."; \
	cd ${WEB_DIR} && npm i && npm run build && cd - || { echo "Error: Frontend build failed"; exit 1; }; \
	\
	# Check web/dist exists
	if [ ! -d "${WEB_DIST_DIR}" ]; then \
		echo "Error: ${WEB_DIST_DIR} not found. Did npm run build fail?"; exit 1; \
	fi; \
	\
	# Create folder structure
	mkdir -p ${DIST_DIR}
	mkdir -p ${DIST_DIR}/api ${DIST_DIR}/web; \
	\
	# Copy API files + .htaccess
	cp ${API_DIR}/*.php ${DIST_DIR}/api/; \
	cp ${API_DIR}/.htaccess ${DIST_DIR}/api/; \
	\
	# Copy built SPA + .htaccess
	cp -r ${WEB_DIST_DIR}/* ${DIST_DIR}/web/; \
	cp ${WEB_DIR}/.htaccess ${DIST_DIR}/web/; \
	\
	# Root .htaccess and .env
	cp .htaccess ${DIST_DIR}/; \
	cp .env ${DIST_DIR}/; \
	echo "Build completed successfully"

# -------------------------
# Deployment via FTP
# -------------------------
.PHONY: deploy
deploy: build
	@echo "Calling deploy.sh..."
	@./scripts/deploy.sh

.PHONY: dev
dev: run
	@echo "Watching API files and configs for changes..."
	@command -v inotifywait >/dev/null 2>&1 || { echo "Error: inotifywait not installed"; exit 1; }; \
	trap "echo 'Stopping dev watcher'; exit 0" INT; \
	while true; do \
		inotifywait -r -e modify,create,delete --exclude 'dist|node_modules' ${API_DIR} ${WEB_DIR} .htaccess .env; \
		echo "Changes detected. Rebuilding dist/..."; \
		$(MAKE) build; \
	done

.PHONY: clean
clean: clean_dist
	@echo "Stopping and pruning docker resources (no images)"
	@${DOCKER} compose -f ${COMPOSE} down --volumes --remove-orphans
	@${DOCKER} container prune -f
	@${DOCKER} volume prune -f

.PHONY: clean_all
clean_all: clean_dist
	@echo "Stopping and pruning docker resources (with images)"
	@${DOCKER} compose -f ${COMPOSE} down --rmi all --volumes --remove-orphans
	@${DOCKER} container prune -f
	@${DOCKER} system prune -a -f
	@${DOCKER} image prune -a -f
	@${DOCKER} volume prune -f

.PHONY: clean_dist
clean_dist:
	@echo "Removing ${DIST_DIR} folder..."
	@rm -rf ${DIST_DIR}/* ${DIST_DIR}/**

# Tails an docker services logs.
.PHONY: logs
logs:
ifdef SERVICE
		${DOCKER} compose -f ${COMPOSE} logs -f --tail=400 $(SERVICE)
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
		${DOCKER} compose -f ${COMPOSE} exec $(SERVICE) /bin/sh
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

