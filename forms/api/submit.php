<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error('Method not allowed', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('contenido invalido');
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
        'first_name',
        'last_name',
        'email',
        'id_type',
        'id_value',
        'country_code',
        'phone',
        'selected_addons',
        'meal_type',
        'event_type',
    ];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("campo no puede estar vacio: {$field}");
        }
    }

    // =========================
    // REQUIRED
    // =========================
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('correo invalido');
    }
    $input['email'] = strtolower($input['email']);

    if (!preg_match('/^\+\d+$/', $input['country_code'])) {
        throw new Exception('codigo de pais invalido');
    }

    if (!ctype_digit($input['phone'])) {
        throw new Exception('telefono debe ser numerico');
    }

    $valid_id_types = ['DNI', 'CE', 'PASSPORT'];
    if (!in_array($input['id_type'], $valid_id_types, true)) {
        throw new Exception('tipo de documento invalido');
    }

    if (!is_array($input['selected_addons'])) {
        throw new Exception("debe seleccionar almenos una sesion");
    }

    // =========================
    // OPTIONAL
    // =========================
    if (
        !empty($input['emergency_contact_country_code']) &&
        !preg_match('/^\+\d+$/', $input['emergency_contact_country_code'])
    ) {
        throw new Exception('codigo de pais del contacto de emergencia invalido');
    }

    if (
        !empty($input['emergency_contact_phone']) &&
        !ctype_digit($input['emergency_contact_phone'])
    ) {
        throw new Exception('telefono de contacto de emergencia debe ser numerico');
    }

    if (
        !empty($input['emergency_contact_email']) &&
        !filter_var($input['emergency_contact_email'], FILTER_VALIDATE_EMAIL)
    ) {
        throw new Exception('correo de contacto de emergencia invalido');
    }

    $today = new DateTime('midnight');
    $arrival = null;
    $departure = null;

    if (!empty($input['arrival_date'])) {
        $arrival = new DateTime($input['arrival_date']);
        if ($arrival < $today) {
            throw new Exception('fecha de llegada no puede ser en el pasado');
        }
    }

    if (!empty($input['departure_date'])) {
        $departure = new DateTime($input['departure_date']);
        if ($departure < $today) {
            throw new Exception('fecha de salida no puede ser en el pasado');
        }
    }

    if ($arrival && $departure && $arrival > $departure) {
        throw new Exception('el retorno no puede ser antes de la llegada');
    }

    if (!empty($input['meal_type']) && !MealType::tryFrom($input['meal_type'])) {
        throw new Exception('tipo de comida invalido');
    }

    if (!empty($input['event_type']) && !EventType::tryFrom($input['event_type'])) {
        throw new Exception('tipo de evento invalido');
    }

    if (!empty($input['currency']) && !Currency::tryFrom($input['currency'])) {
        throw new Exception('moneda invalida');
    }

    db()->beginTransaction();

    $form = fetch_active_form();
    if (empty($form)) {
        throw new Exception("No se encontro un formulario activo");
    }

    $existing_order_id = check_order_status($form['id'], $input['submission_id'] ?? null);
    $submission_id = upsert_submission($form['id'], $input);
    $order_id = create_update_order(
        $form['id'],
        $submission_id,
        $input['selected_addons'],
        !empty($input['event_type']) ? EventType::from($input['event_type']) : EventType::ALL_SESSIONS,
        !empty($input['meal_type']) ? MealType::from($input['meal_type']) : MealType::REGULAR,
        !empty($input['currency']) ? Currency::from($input['currency']) : Currency::PEN,
        $existing_order_id,
    );

    db()->commit();
    respond([
        "submission_id" => $submission_id,
        "order_id" => $order_id,
    ]);
} catch (Throwable $e) {
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    error_log($e->getMessage());
    respond_error($e->getMessage(), 400);
}
