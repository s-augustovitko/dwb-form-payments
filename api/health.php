<?php
require_once __DIR__ . '/bootstrap.php';

respond([
    'status' => 'ok',
    'env'    => getenv('APP_ENV') ?: 'unknown'
]);
