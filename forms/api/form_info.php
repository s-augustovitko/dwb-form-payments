<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_error('Method not allowed', 405);
}

try {
    $settings_prep = db()->prepare(
        '
        SELECT
            id,
            title,
            description,

            form_type,
            start_date,
            end_date,

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

    $meals_prep = db()->prepare(
        '
        SELECT
            id,
            title
        FROM meals
        WHERE
            settings_id = :settings_id
        '
    );
    $meals_prep->execute([
        ':settings_id' => $settings['id']
    ]);
    $meals = $meals_prep->fetchAll();

    $sessions_prep = db()->prepare(
        '
        SELECT
            id,
            session_time,
            title
        FROM sessions
        WHERE
            settings_id = :settings_id AND
            session_time > NOW()
        ORDER BY
            session_time ASC
        '
    );
    $sessions_prep->execute([':settings_id' => $settings['id']]);
    $sessions = $sessions_prep->fetchAll();

    if ($settings['form_type'] !== 'TALK' && empty($sessions)) {
        throw new Exception("No hay sesiones en el curso");
    }

    respond([
        'settings' => $settings,
        'sessions' => $sessions,
        'meals' => $meals
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 500);
}
