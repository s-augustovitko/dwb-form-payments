#!/usr/bin/env bash

set -euo pipefail

# ---- CONFIG ----
DIST_DIR="${DIST_DIR:-dist}"
FTP_ENV_FILE="${FTP_ENV_FILE:-.ftp.env}"

echo "Deploying ${DIST_DIR}/ to FTP..."

# Check lftp installed
if ! command -v lftp >/dev/null 2>&1; then
    echo "Error: lftp not installed"
    exit 1
fi

# Check env file exists
if [ ! -f "$FTP_ENV_FILE" ]; then
    echo "Error: FTP env file $FTP_ENV_FILE not found!"
    exit 1
fi

# Load FTP credentials safely
set -a
. "$FTP_ENV_FILE"
set +a

# Validate required variables
: "${FTP_HOST:?Missing FTP_HOST}"
: "${FTP_USER:?Missing FTP_USER}"
: "${FTP_PASS:?Missing FTP_PASS}"
: "${FTP_TARGET_DIR:?Missing FTP_TARGET_DIR}"

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "\
set ssl:check-hostname no; \
mirror -R -e --parallel=4 \"${DIST_DIR}\" \"${FTP_TARGET_DIR}\"; \
set ssl:check-hostname yes; \
bye" || {
    echo "FTP deploy failed"
    exit 1
}

echo "Deployed successfully"
