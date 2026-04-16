<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error('Method not allowed', 405);
}

try {
    // Decode JSON input safely
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
        throw new Exception('Contenido inválido');
    }

    // =========================
    // CLEAN ALL INPUTS
    // =========================
    array_walk_recursive($input, function (&$value) {
        if (is_string($value)) {
            $value = clean_string($value);
        }
    });

    // =========================
    // REQUIRED FIELDS
    // =========================
    $required_fields = [
        'payment_type',
        'submission_id',
    ];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("campo no puede estar vacío: {$field}");
        }
    }

    if (!empty($input['payment_type']) && !in_array($input['payment_type'], EnumConstants::getPaymentTypes(), true)) {
        throw new Exception('tipo de pago invalido');
    }

    if (empty($input['culqi_token']) && $input['payment_type'] === 'CULQI') {
        throw new Exception('token invalido, por favor intente de nuevo mas tarde');
    }

    $form = fetch_active_form();
    if (empty($form)) {
        throw new Exception("No se encontro un formulario activo");
    }

    $submission = fetch_submission_by_id($form['id'], $input['submission_id']);
    if (empty($submission)) {
        throw new Exception("no se encontro la entrada, por favor intente desde el paso anterior");
    }

    $order_id = check_order_status($form['id'], $input['submission_id'] ?? null);
    if (empty($order_id)) {
        throw new Exception("No se encontro la orden o es invalida");
    }

    $order = null;
    $payment_id = null;
    try {
        db()->beginTransaction();
        $order = update_and_fetch_order_for_payment(
            $form['id'],
            $order_id,
            $submission['id'],
            $input['payment_type'] === 'ON_SITE' ?
                'ON_SITE' :
                'DRAFT',
        );

        $payment_id = upsert_payment(
            '',
            $order['id'],
            $input['culqi_token'] ?? null,
            'PENDING',
            (float) $order['amount'],
            $order['currency'],
            $input['payment_type'],
            $input['payment_type'] === 'CULQI' ? 'CARD' : 'CASH',
            null,
            null
        );

        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) {
            db()->rollBack();
        }
        throw $e;
    }

    // =========================
    // CULQI
    // =========================
    if ($input['payment_type'] === 'CULQI' && (float) $order['amount'] > 0.0) {
        $charge_data = [
            "amount" => strval(round((float) $order['amount'] * 100)),
            "currency_code" => $order['currency'] ?? 'PEN',
            "email" => $submission['email'],
            "source_id" => $input['culqi_token'] ?? "",
            "antifraud_details" => [
                "first_name" => $submission['first_name'],
                "last_name" => $submission['last_name'],
                "email" => $submission['email'],
                "phone_number" => ($submission['country_code'] ?? '+51') . $submission['phone']
            ],
        ];

        $charge = null;
        $user_message = null;
        try {
            $charge = createCulqiCharge($charge_data);
            $charge['outcome'] = $charge['outcome'] ?? ['type' => 'error'];
            $charge['source'] = $charge['source'] ?? ['type' => 'error'];
        } catch (Throwable $e) {
            $user_message = $e->getMessage() ?? "";
            $charge = [
                'id' => null,
                'outcome' => ['type' => 'error'],
                'source' => ['type' => 'error'],
            ];
        }
        $user_message = $user_message ?:
            $charge["user_message"] ??
            "Intente de nuevo o use otro metodo de pago";

        $outcome_type = trim(strtolower($charge['outcome']['type'] ?? ''));
        $success_codes = ['successful_charge', 'venta_exitosa'];
        $payment_status = in_array($outcome_type, $success_codes, true) ?
            'PAID' :
            'FAILED';

        try {
            db()->beginTransaction();

            upsert_payment(
                $payment_id,
                $order['id'],
                $charge['id'],
                $payment_status,
                (float) $order['amount'],
                $order['currency'],
                $input['payment_type'],
                $charge['source']['type'],
                $user_message,
                json_encode($charge) ?: '{}',
            );

            update_and_fetch_order_for_payment(
                $form['id'],
                $order['id'],
                $submission['id'],
                $payment_status === 'FAILED' ?
                    'CANCELLED' :
                    'CONFIRMED',
            );

            db()->commit();
        } catch (Throwable $e) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
            throw $e;
        }

        if ($payment_status === 'FAILED') {
            throw new Exception("El pago no se pudo procesar: " . $user_message);
        }
    }

    respond([
        'submission_id' => $submission['id'],
        'order_id' => $order['id'],
        'payment_id' => $payment_id,
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 400);
}
