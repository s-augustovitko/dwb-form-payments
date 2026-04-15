<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_error('Method not allowed', 405);
}

try {
    $submission_id = $_GET['submission_id'] ?? null;
    if (!$submission_id) {
        respond_error('Debe mandar el codigo de respuesta', 400);
    }

    if (!preg_match(
        '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/',
        $submission_id
    )) {
        respond_error('Respuesta de formulario invalida', 400);
    }

    $form = fetch_active_form();
    if (!$form) {
        throw new Exception('No hay formularios activos');
    }

    $submission = fetch_submission_by_id($form['id'], $submission_id);
    if (!$submission) {
        throw new Exception('No se encontro la respuesta, ingrese sus datos nuevamente');
    }

    $order = fetch_order_by_submission_id($form['id'], $submission_id);
    if (!$order) {
        throw new Exception('No se encontro la orden, ingrese sus datos nuevamente');
    }
    $order_items = fetch_order_items_by_order_id($order['id']);

    respond([
        'submission' => $submission,
        'order' => $order,
        'order_items' => $order_items,
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 404);
}
