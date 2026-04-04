<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_error('Method not allowed', 405);
}

try {
    $form_id = $_GET['form_id'] ?? null;

    if (!$form_id) {
        respond_error('Missing form_id parameter', 400);
    }

    // Validate UUID (v1–v5)
    if (!preg_match(
        '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/',
        $form_id
    )) {
        respond_error('Invalid form_id format', 400);
    }

    $form_response_prep = db()->prepare(
        '
        SELECT
            r.first_name,
            r.payment_status,
            r.payment_id,
            s.start_date,
            r.email
        FROM form_responses r
        JOIN settings s ON s.id = r.settings_id AND active = TRUE
        WHERE
            r.id = :form_id
        LIMIT 1
        '
    );
    $form_response_prep->execute([
        ':form_id' => $form_id
    ]);
    $form_response = $form_response_prep->fetch();
    if (!$form_response) {
        throw new Exception("Formulario invalido");
    }

    respond($form_response);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 404);
}
