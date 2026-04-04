.PHONY: all
all: run

include ../docker.mk

API_DIR = ./api
WEB_DIR = ./web
DIST_DIR = ../dist
WEB_DIST_DIR := ${WEB_DIR}/dist

CHANGES_DIRS="api web/src"
COMPOSE="./compose.yaml"
DOCKER="podman"
ENV_FILE="../.env"

FTP_ENV_FILE = ../.ftp.env


.PHONY: deps
deps:
	@cd ${WEB_DIR} && npm i

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
	cp ${ENV_FILE} ${DIST_DIR}/; \
	echo "Build completed successfully"

.PHONY: deploy
deploy: build ## Deploy service via FTP - needs .ftp.env to be created
	@echo "Calling deploy.sh..."
	@./deploy.sh ${DIST_DIR} ${FTP_ENV_FILE}

