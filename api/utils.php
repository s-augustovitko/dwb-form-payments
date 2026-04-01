<?php

declare(strict_types=1);

/**
 * utils.php
 * Shared utilities for secure API endpoints
 */

/* -----------------------------
   Secure headers
------------------------------*/
function set_secure_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: geolocation=()');
}

/* -----------------------------
   CORS (adjust origin!)
------------------------------*/
function handle_cors(): void
{
    $allowedOrigins = array_values(array_filter(array_map(
        'trim',
        explode(',', (string) getenv('ALLOWED_ORIGINS'))
    )));

    if (!empty($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }

    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 600');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/* -----------------------------
   .env loader
------------------------------*/
function load_env(string $path): void
{
    if (!file_exists($path)) return;

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;

        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        [$key, $value] = array_map('trim', $parts);
        $value = trim($value, "\"'");

        if (!getenv($key)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}


/* -----------------------------
   Env validation
------------------------------*/
function require_env(array $keys): void
{
    foreach ($keys as $key) {
        if (!getenv($key)) {
            error_log("Missing env var: $key");
            respond_error('Server misconfiguration', 500);
        }
    }
}

/* -----------------------------
   Database connection
------------------------------*/
function db(): PDO
{
    static $pdo;

    if ($pdo === null) {
        $pdo = new PDO(
            sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                getenv('DB_HOST'),
                getenv('DB_NAME')
            ),
            getenv('DB_USER'),
            getenv('DB_PASS'),
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }

    return $pdo;
}

/* -----------------------------
   JSON helpers
------------------------------*/
function json_input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        respond_error('Invalid JSON', 400);
    }
    return $data;
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function respond_error(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/* -----------------------------
   MySQL rate limiting
------------------------------*/
function rate_limit(int $maxRequests, int $seconds): void
{
    try {
        $pdo = db();

        $ip  = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $now = time();

        $stmt = $pdo->prepare(
            'INSERT INTO rate_limits (ip, window_start, count)
     VALUES (:ip, :now1, 1)
     ON DUPLICATE KEY UPDATE
        count = IF(:now2 - window_start > :window1, 1, count + 1),
        window_start = IF(:now3 - window_start > :window2, :now4, window_start)'
        );

        $stmt->execute([
            ':ip'      => $ip,
            ':now1'    => $now,
            ':now2'    => $now,
            ':now3'    => $now,
            ':now4'    => $now,
            ':window1' => $seconds,
            ':window2' => $seconds,
        ]);

        $stmt = $pdo->prepare(
            'SELECT count FROM rate_limits WHERE ip = :ip'
        );
        $stmt->execute([':ip' => $ip]);

        $count = (int)$stmt->fetchColumn();

        if ($count > $maxRequests) {
            respond_error('Too many requests', 429);
        }

        if (random_int(1, 200) === 1) {
            $stmt = $pdo->prepare(
                'DELETE FROM rate_limits
                 WHERE window_start < :cutoff'
            );
            $stmt->execute([
                ':cutoff' => $now - ($seconds * 2)
            ]);
        }
    } catch (Throwable $e) {
        error_log('Rate limiter failure: ' . $e->getMessage());
        respond_error('Service temporarily unavailable', 503);
    }
}

/* -----------------------------
   Input sanitization
------------------------------*/
function clean_string(string $value, int $maxLength = 512): string
{
    $value = trim($value);
    $value = mb_substr($value, 0, $maxLength);
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

/* -----------------------------
   UUIDv4
------------------------------*/
function guidv4($data = null)
{
    // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
    $data = $data ?? random_bytes(16);
    assert(strlen($data) == 16);

    // Set version to 0100
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits 6-7 to 10
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

    // Output the 36 character UUID.
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/* -----------------------------
   Payments
------------------------------*/
function createCulqiCharge(array $data)
{
    $apiKey = getenv('CULQI_PRIV_KEY');

    if (!$apiKey) {
        throw new Exception("Missing CULQI_PRIV_KEY");
    }

    $ch = curl_init("https://api.culqi.com/v2/charges");

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$apiKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);

    if ($response === false) {
        throw new Exception("cURL error: " . curl_error($ch));
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    unset($ch);

    $decoded = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON response");
    }

    // Handle Culqi errors
    if ($statusCode < 200 || $statusCode >= 300) {
        $message = $decoded['user_message']
            ?? $decoded['merchant_message']
            ?? "Culqi charge error";

        throw new Exception($message, $statusCode);
    }

    if (!isset($decoded['id'])) {
        throw new Exception("Missing charge ID in response");
    }

    return $decoded;
}

function getTotalPrice(array $input)
{
    $settings_prep = db()->prepare(
        '
        SELECT
            meal_price_pen,
            meal_price_usd,
            session_price_pen,
            session_price_usd
        FROM settings
        WHERE
            active = TRUE AND
            end_date > NOW()
        ORDER BY
            start_date ASC
        LIMIT 1
        '
    );
    $settings_prep->execute();
    $settings = $settings_prep->fetch();
    if (!$settings) {
        throw new Exception("No hay formularios activos");
    }

    $currency = (float)$settings['session_price_usd'] === 0.0 && (float)$settings['meal_price_usd'] === 0.0  ? "PEN" : $input['currency'];
    $sessionPrice = (float)($currency === 'USD' ? $settings['session_price_usd'] : $settings['session_price_pen']);
    $mealPrice = (float)($currency === 'USD' ? $settings['meal_price_usd'] : $settings['meal_price_pen']);
    $expectedPayment = ((int)($input['sessions_count']) * $sessionPrice) + ((int)($input['meals_count']) * $mealPrice);

    return [
        'payment_amount' => $expectedPayment,
        'currency' => $currency,
        'meal_price' => $mealPrice,
        'session_price' => $sessionPrice,
    ];
}
