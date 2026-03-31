include docker.mk

.PHONY: all
all: run

COMPOSE="./docker/compose.yaml"
DOCKER="podman"
ENV_FILE=".env"

API_DIR = api
WEB_DIR = web
DIST_DIR = dist
WEB_DIST_DIR := ${WEB_DIR}/dist

FTP_ENV_FILE = ./.ftp.env

.PHONY: deps
deps:
	@cd web && npm i
	$(MAKE) -C admin deps

.PHONY: build
build: clean_dist ## Builds the project
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

.PHONY: deploy
deploy: build ## Deploy service via FTP - needs .ftp.env to be created
	@echo "Calling deploy.sh..."
	@./scripts/deploy.sh

.PHONY: dev
dev: run ## Runs the project and watches for any changes
	@echo "Watching files and configs for changes..."
	@command -v inotifywait >/dev/null 2>&1 || { echo "Error: inotifywait not installed"; exit 1; }; \
	trap "echo 'Stopping dev watcher'; exit 0" INT; \
	while true; do \
		inotifywait -r -e modify,create,delete ${API_DIR} ${WEB_DIR}/src ${WEB_DIR}/.htaccess .env; \
		echo "Changes detected. Rebuilding dist/..."; \
		$(MAKE) build; \
	done

