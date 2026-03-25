<?php

declare(strict_types=1);

require_once __DIR__ . '/utils.php';

/* Load environment */
load_env(__DIR__ . '/../.env');

/* Global security */
set_secure_headers();
handle_cors();
rate_limit(60, 60);

/* Basic DoS protection */
if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 1_000_000) {
    respond_error('Payload too large', 413);
}

/* Fail fast if misconfigured */
require_env([
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'APP_ENV',
    'ALLOWED_ORIGINS',
    'CULQI_PRIV_KEY'
]);
