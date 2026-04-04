#!/usr/bin/env bash

set -euo pipefail

# Ensure both parameters are passed
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_directory> <ftp_env_file>"
    exit 1
fi

SOURCE_DIR="$1"
FTP_ENV_FILE="$2"

# Check if lftp is installed
if ! command -v lftp >/dev/null 2>&1; then
    echo "Error: lftp is not installed."
    exit 1
fi

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory '$SOURCE_DIR' not found or is not a directory."
    exit 1
fi

# Check if the env file exists
if [ ! -f "$FTP_ENV_FILE" ]; then
    echo "Error: FTP env file '$FTP_ENV_FILE' not found!"
    exit 1
fi

echo "Deploying ${SOURCE_DIR}/ to FTP using config ${FTP_ENV_FILE}..."

# Load FTP credentials safely
set -a
# shellcheck source=/dev/null
. "$FTP_ENV_FILE"
set +a

# Validate required variables (must be present in the provided env file)
: "${FTP_HOST:?Missing FTP_HOST in $FTP_ENV_FILE}"
: "${FTP_USER:?Missing FTP_USER in $FTP_ENV_FILE}"
: "${FTP_PASS:?Missing FTP_PASS in $FTP_ENV_FILE}"
: "${FTP_TARGET_DIR:?Missing FTP_TARGET_DIR in $FTP_ENV_FILE}"

# ---- DEPLOYMENT ----
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" -e "\
set ssl:check-hostname no; \
mirror -R -e --parallel=4 \"${SOURCE_DIR}\" \"${FTP_TARGET_DIR}\"; \
set ssl:check-hostname yes; \
bye" || {
    echo "FTP deploy failed"
    exit 1
}

echo "Deployed successfully from ${SOURCE_DIR}"
