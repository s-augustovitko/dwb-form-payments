<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_error('Method not allowed', 405);
}

try {
    $form_response_prep = db()->prepare(
        '
        SELECT
            first_name,
            payment_status,
            payment_id,
            email
        FROM form_responses
        WHERE
            id = :form_id
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
