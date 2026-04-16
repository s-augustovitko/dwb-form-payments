<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_error('Method not allowed', 405);
}

try {
    $form = fetch_active_form();
    if (empty($form)) {
        throw new Exception("No hay cursos activos");
    }

    $addons = fetch_addons_from_form_id($form['id']);
    if (empty($addons)) {
        throw new Exception("No hay cursos activos");
    }

    respond([
        'form' => $form,
        'addons' => $addons,
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage() ?: "No hay curso activo");
    respond_error($e->getMessage(), 500);
}
