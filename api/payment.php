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
        'form_id',
        'token',
    ];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Campo no puede estar vacío: {$field}");
        }
    }

    // =========================
    // FETCH FORM
    // =========================
    $form_prep = db()->prepare("SELECT * FROM form_responses WHERE id = :form_id");
    $form_prep->execute([':form_id' => $input['form_id']]);
    $form = $form_prep->fetch();
    if (!$form) {
        throw new Exception("Formulario inválido");
    }
    if ($form['payment_status'] === 'SUCCESS') {
        respond([
            'payment_id' => $form['payment_id'],
            'payment_status' => 'SUCCESS',
        ]);
    }

    // =========================
    // PREPARE CHARGE DATA
    // =========================
    $phone_number = ($form['country_code'] ?? '+51') . $form['phone'];
    $charge_data = [
        "amount" => strval(round((float) $form['payment_amount'] * 100)),
        "currency_code" => $form['currency'] ?? 'PEN',
        "email" => $form['email'],
        "source_id" => $input['token'],
        "antifraud_details" => [
            "first_name" => $form['first_name'],
            "last_name" => $form['last_name'],
            "email" => $form['email'],
            "phone_number" => $phone_number
        ],
    ];

    $charge = null;
    $user_message = null;
    try {
        $charge = createCulqiCharge($charge_data);
        if (!isset($charge['id']) || !isset($charge['outcome']['type'])) {
            throw new Exception("Respuesta de pago inválida");
        }
    } catch (Throwable $e) {
        $user_message = $e->getMessage();
        $charge = ['id' => null, 'outcome' => ['type' => 'error']];
    }
    $user_message = $user_message ?? $charge["user_message"] ?? "Intente de nuevo o use otro metodo de pago";

    $outcome_type = trim(strtolower($charge['outcome']['type'] ?? ''));
    $success_codes = ['successful_charge', 'venta_exitosa'];
    $payment_status = in_array($outcome_type, $success_codes, true) ? 'SUCCESS' : 'DECLINED';

    // =========================
    // UPDATE DATABASE
    // =========================
    $stmt = db()->prepare("
        UPDATE form_responses
        SET payment_status = :payment_status,
            payment_id = :payment_id
        WHERE id = :form_id
    ");
    $stmt->execute([
        ":payment_status" => $payment_status,
        ":payment_id" => $charge['id'],
        ":form_id" => $input['form_id'],
    ]);

    if ($payment_status === 'DECLINED') {
        throw new Exception("El pago no se pudo procesar: " . $user_message);
    }

    respond([
        'payment_id' => $charge['id'],
        'payment_status' => $payment_status,
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 400);
}
