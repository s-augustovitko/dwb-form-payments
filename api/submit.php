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
        'settings_id',
        'first_name',
        'last_name',
        'email',
        'country_code',
        'phone',
        'id_type',
        'id_value'
    ];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("campo no puede estar vacio: {$field}");
        }
    }

    // =========================
    // BASIC VALIDATION
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

    // =========================
    // ENUM VALIDATION
    // =========================
    $valid_id_types = ['DNI', 'CE', 'PASSPORT'];
    if (!in_array($input['id_type'], $valid_id_types, true)) {
        throw new Exception('tipo de documento invalido');
    }

    $valid_meal_types = ['REGULAR', 'VEGGIE', 'NONE'];
    if (isset($input['meal_type']) && !in_array($input['meal_type'], $valid_meal_types, true)) {
        throw new Exception('tipo de comida invalido');
    }

    $valid_event_types = ['FULL', 'DAYS', 'SESSIONS'];
    if (isset($input['event_type']) && !in_array($input['event_type'], $valid_event_types, true)) {
        throw new Exception('tipo de evento invalido');
    }

    $valid_currency = ['PEN', 'USD'];
    if (isset($input['currency']) && !in_array($input['currency'], $valid_currency, true)) {
        throw new Exception('moneda invalida');
    }

    // =========================
    // NUMERIC RULES
    // =========================
    if (isset($input['sessions_count']) && (!is_numeric($input['sessions_count']) || $input['sessions_count'] < 1)) {
        throw new Exception('numero de sesiones debe ser al menos 1');
    }

    if (isset($input['meals_count']) && (!is_numeric($input['meals_count']) || $input['meals_count'] < 0)) {
        throw new Exception('numero de comidas no puede ser negativo');
    }
    $mealsCount = isset($input['meals_count']) ? (int)$input['meals_count'] : 0;
    $mealType = $input['meal_type'] ?? null;

    if ($mealType === 'NONE') {
        $mealsCount = 0;
    } elseif ($mealsCount === 0) {
        $mealType = 'NONE';
    }

    $input['meals_count'] = $mealsCount;
    $input['meal_type'] = $mealType;

    // =========================
    // EMERGENCY CONTACT
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

    // =========================
    // DATE VALIDATION
    // =========================
    $today = new DateTime('today');
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

    $form_id = $input['form_id'] ?? guidv4();
    $pricing = getTotalPrice($input);

    // =========================
    // PREPARE INSERT
    // =========================
    $stmt = db()->prepare(
        '
        INSERT INTO form_responses (
            id,
            settings_id,

            first_name,
            last_name,
            email,
            country_code,
            phone,
            id_type,
            id_value,

            meal_type,
            meals_count,
            meal_price,

            event_type,
            sessions_count,
            session_price,

            arrival_date,
            departure_date,

            medical_insurance,

            emergency_contact_name,
            emergency_contact_country_code,
            emergency_contact_phone,
            emergency_contact_email,

            currency,
            payment_amount,
            payment_status
        ) VALUES (
            :form_id,
            :settings_id,

            :first_name,
            :last_name,
            :email,
            :country_code,
            :phone,
            :id_type,
            :id_value,

            :meal_type,
            :meals_count,
            :meal_price,

            :event_type,
            :sessions_count,
            :session_price,

            :arrival_date,
            :departure_date,

            :medical_insurance,

            :emergency_contact_name,
            :emergency_contact_country_code,
            :emergency_contact_phone,
            :emergency_contact_email,

            :currency,
            :payment_amount,
            :payment_status
        )
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            email = VALUES(email),
            country_code = VALUES(country_code),
            phone = VALUES(phone),
            id_type = VALUES(id_type),
            id_value = VALUES(id_value),
            meal_type = VALUES(meal_type),
            meals_count = VALUES(meals_count),
            meal_price = VALUES(meal_price),
            event_type = VALUES(event_type),
            sessions_count = VALUES(sessions_count),
            session_price = VALUES(session_price),
            arrival_date = VALUES(arrival_date),
            departure_date = VALUES(departure_date),
            medical_insurance = VALUES(medical_insurance),
            emergency_contact_name = VALUES(emergency_contact_name),
            emergency_contact_country_code = VALUES(emergency_contact_country_code),
            emergency_contact_phone = VALUES(emergency_contact_phone),
            emergency_contact_email = VALUES(emergency_contact_email),
            currency = VALUES(currency),
            payment_amount = VALUES(payment_amount);
        '
    );

    $stmt->execute([
        ':form_id' => $form_id,
        ':settings_id' => $input['settings_id'],

        ':first_name' => $input['first_name'],
        ':last_name' => $input['last_name'],
        ':email' => $input['email'],
        ':country_code' => $input['country_code'],
        ':phone' => $input['phone'],
        ':id_type' => $input['id_type'],
        ':id_value' => $input['id_value'],

        ':meal_type' => $input['meal_type'] ?? null,
        ':meals_count' => $input['meals_count'],
        ':meal_price' => $pricing['meal_price'] ?? 0, # pricing

        ':event_type' => $input['event_type'] ?? null,
        ':sessions_count' => $input['sessions_count'] ?? 0,
        ':session_price' => $pricing['session_price'] ?? 0, # pricing

        ':arrival_date' => $input['arrival_date'] ?? null,
        ':departure_date' => $input['departure_date'] ?? null,

        ':medical_insurance' => $input['medical_insurance'] ?? null,

        ':emergency_contact_name' => $input['emergency_contact_name'] ?? null,
        ':emergency_contact_country_code' => $input['emergency_contact_country_code'] ?? null,
        ':emergency_contact_phone' => $input['emergency_contact_phone'] ?? null,
        ':emergency_contact_email' => $input['emergency_contact_email'] ?? null,

        ':currency' => $pricing['currency'] ?? 'PEN', # pricing
        ':payment_amount' => $pricing['payment_amount'] ?? 0.0, # pricing

        ':payment_status' => ((float) $pricing['payment_amount'] <= 0.0) ? 'NOT_NEEDED' : 'PENDING', # pricing
    ]);

    respond([
        'form_id' => $form_id,
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond_error($e->getMessage(), 400);
}
