<?php

declare(strict_types=1);

function fetch_active_form(): array
{
    $form_prep = db()->prepare(
        '
        SELECT
            id,
            title,
            description,
            form_type
        FROM forms
        WHERE
            active = TRUE AND
            end_date > NOW()
        ORDER BY
            start_date ASC
        LIMIT 1
        '
    );
    $form_prep->execute();
    return $form_prep->fetch() ?? null;
}

function fetch_addons_from_form_id(string $form_id): array
{
    $addons_prep = db()->prepare(
        '
        SELECT
            id,
            title,
            addon_type,
            price,
            currency,
            hint,
            date_time
        FROM addons
        WHERE
            active = TRUE AND
            form_id = :form_id
        ORDER BY sort_order ASC
        '
    );
    $addons_prep->execute([':form_id' => $form_id]);
    return $addons_prep->fetchAll();
}

function upsert_submission(string $form_id, array $input): string
{
    $submission_id = $input['submission_id'] ?? guidv4();
    db()->prepare(
        '
        INSERT INTO submissions (
            id,
            form_id,
            first_name,
            last_name,
            email,
            id_type,
            id_value,
            country_code,
            phone,
            arrival_date,
            departure_date,
            medical_insurance
        ) VALUES (
            :id,
            :form_id,
            :first_name,
            :last_name,
            :email,
            :id_type,
            :id_value,
            :country_code,
            :phone,
            :arrival_date,
            :departure_date,
            :medical_insurance
        ) ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            email = VALUES(email),
            id_type = VALUES(id_type),
            id_value = VALUES(id_value),
            country_code = VALUES(country_code),
            phone = VALUES(phone),
            arrival_date = VALUES(arrival_date),
            departure_date = VALUES(departure_date),
            medical_insurance = VALUES(medical_insurance)
        '
    )->execute([
        ':id' => $submission_id,
        ':form_id' => $form_id,
        ':first_name' => $input['first_name'],
        ':last_name' => $input['last_name'],
        ':email' => $input['email'],
        ':id_type' => $input['id_type'] ?? 'DNI',
        ':id_value' => $input['id_value'],
        ':country_code' => $input['country_code'] ?? '+51',
        ':phone' => $input['phone'],
        ':arrival_date' => $input['arrival_date'] ?? null,
        ':departure_date' => $input['departure_date'] ?? null,
        ':medical_insurance' => $input['medical_insurance'] ?? null
    ]);

    if (
        empty($input['emergency_contact_full_name']) ||
        empty($input['emergency_contact_phone'])
    ) {
        return $submission_id;
    }

    db()->prepare(
        '
        INSERT INTO emergency_contacts (
            id,
            submission_id,
            full_name,
            email,
            country_code,
            phone
        ) VALUES (
            UUID(),
            :submission_id,
            :full_name,
            :email,
            :country_code,
            :phone
        ) ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            email = VALUES(email),
            country_code = VALUES(country_code),
            phone = VALUES(phone)
        '
    )->execute([
        ':submission_id' => $submission_id,
        ':full_name' => $input['emergency_contact_full_name'],
        ':email' => $input['emergency_contact_email'],
        ':country_code' => $input['emergency_contact_country_code'] ?? '+51',
        ':phone' => $input['emergency_contact_phone'],
    ]);

    return $submission_id;
}

function _get_addons_for_order(
    string $form_id,
    array $addon_ids,
    EventType $event_type,
    MealType $meal_type,
    Currency $currency,
) {
    $addons = fetch_addons_from_form_id($form_id);
    if (empty($addons)) {
        throw new Exception("No se encontraron sesiones activas");
    }

    $selected_addons = [];

    $session_count = 0;
    $selected_session_count = 0;
    $full_course_selected = false;
    $all_session_discount = [];
    $early_discount = [];

    foreach ($addons as $addon) {
        // Skip anything that's not your selected currency
        if (Currency::from($addon['currency']) !== $currency) {
            continue;
        }

        if (AddonType::from($addon['addon_type']) === AddonType::EARLY_DISCOUNT) {
            $early_discount = $addon;
            continue;
        }

        if (AddonType::from($addon['addon_type']) === AddonType::ALL_SESSIONS_DISCOUNT) {
            $all_session_discount = $addon;
            continue;
        }

        if (AddonType::from($addon['addon_type']) === AddonType::SESSION) {
            $session_count++;
        }

        // Add all sessions and all_sessions_discount if event_type is 'ALL_SESSIONS'
        if (
            $event_type === EventType::ALL_SESSIONS &&
            AddonType::from($addon['addon_type']) === AddonType::SESSION
        ) {
            array_push($selected_addons, $addon);
            $selected_session_count++;
            $full_course_selected = true;
            continue;
        }

        // Dont apply meals if meal_type is NONE
        if (
            $meal_type === MealType::NONE &&
            AddonType::from($addon['addon_type']) === AddonType::MEAL
        ) {
            continue;
        }

        // Only sessions and meals (if meals is not NONE) left
        if (in_array($addon['id'], $addon_ids)) {
            array_push($selected_addons, $addon);

            if (AddonType::from($addon['addon_type']) === AddonType::SESSION) {
                $selected_session_count++;
            }
        }
    }

    // Check if at least one session is selected
    if (empty($selected_addons) || $selected_session_count === 0) {
        throw new Exception("Debe seleccionar almenos una sesion");
    }

    // Check if full course is selected
    if ($selected_session_count === $session_count) {
        $full_course_selected = true;
    }

    // If no full course selected skip discounts
    if (!$full_course_selected) {
        return $selected_addons;
    }

    // Add full course discount
    if (!empty($all_session_discount)) {
        array_push($selected_addons, $all_session_discount);
    }

    // Add early bird discount if applicable
    if (
        !empty($early_discount) &&
        isset($early_discount['date_time'])
    ) {
        $discount_deadline = new DateTime(
            $early_discount['date_time'],
            new DateTimeZone('UTC'),
        );
        $now = new DateTime('now', new DateTimeZone('UTC'));

        if ($discount_deadline > $now) {
            array_push($selected_addons, $early_discount);
        }
    }

    return $selected_addons;
}

function fetch_order_by_submission_id(string $form_id, string $submission_id): ?array
{
    $order_prep = db()->prepare(
        '
        SELECT
            id,
            form_id,
            submission_id,
            status,
            amount,
            currency,
            event_type,
            meal_type
        FROM orders
        WHERE
            submission_id = :submission_id AND
            form_id = :form_id
        LIMIT 1
        '
    );
    $order_prep->execute([
        ':submission_id' => $submission_id,
        ':form_id' => $form_id,
    ]);
    return $order_prep->fetch() ?? null;
}

function fetch_submission_by_id(string $form_id, string $submission_id): ?array
{
    $submission_prep = db()->prepare(
        '
        SELECT
            s.id,
            s.form_id,
            s.first_name,
            s.last_name,
            s.email,
            s.id_type,
            s.id_value,
            s.country_code,
            s.phone,
            s.arrival_date,
            s.departure_date,
            s.medical_insurance,
            ec.full_name  emergency_contact_full_name,
            ec.email  emergency_contact_email,
            ec.country_code  emergency_contact_country_code,
            ec.phone  emergency_contact_phone
        FROM submissions s
        LEFT JOIN emergency_contacts ec ON ec.submission_id = s.id
        WHERE
            s.id = :submission_id AND
            s.form_id = :form_id
        LIMIT 1
        '
    );
    $submission_prep->execute([
        ':submission_id' => $submission_id,
        ':form_id' => $form_id,
    ]);
    return $submission_prep->fetch() ?? null;
}


function fetch_order_items_by_order_id(string $order_id): array
{
    $order_items_prep = db()->prepare(
        '
        SELECT
            id,
            order_id,
            addon_id,
            title,
            addon_type,
            price,
            currency,
            date_time
        FROM order_items
        WHERE
            order_id = :order_id
        ORDER BY addon_type, date_time ASC
        '
    );
    $order_items_prep->execute([
        ':order_id' => $order_id,
    ]);
    return $order_items_prep->fetchAll();
}

function calculate_total(array $selected_addons): float
{
    $total = 0.0;
    foreach ($selected_addons as $addon) {
        switch (AddonType::from($addon['addon_type'])) {
            case AddonType::SESSION:
            case AddonType::MEAL:
                $total = $total + (float) $addon['price'];
                break;

            case AddonType::ALL_SESSIONS_DISCOUNT:
            case AddonType::EARLY_DISCOUNT:
                $total = $total - (float) $addon['price'];
                break;
        }
    }

    return $total;
}

function create_update_order(
    string $form_id,
    string $submission_id,
    array $selected_addon_ids,
    EventType $event_type,
    MealType $meal_type,
    Currency $currency = Currency::PEN,
    ?string $existing_order_id,
): string {
    $selected_addons = _get_addons_for_order(
        $form_id,
        $selected_addon_ids,
        $event_type,
        $meal_type,
        $currency,
    );

    $total = calculate_total($selected_addons);
    $order_id = $existing_order_id ?? guidv4();
    db()->prepare(
        '
        INSERT INTO orders (
            id,
            form_id,
            submission_id,
            status,
            amount,
            currency,
            event_type,
            meal_type
        ) VALUES (
            :id,
            :form_id,
            :submission_id,
            :status,
            :amount,
            :currency,
            :event_type,
            :meal_type
        ) ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            currency = VALUES(currency),
            event_type = VALUES(event_type),
            meal_type = VALUES(meal_type)
        '
    )->execute([
        'id' => $order_id,
        'form_id' => $form_id,
        'submission_id' => $submission_id,
        'status' => OrderStatus::DRAFT->value,
        'amount' => $total,
        'currency' => $currency->value,
        'event_type' => $event_type->value,
        'meal_type' => $meal_type->value
    ]);

    db()->prepare(
        '
        DELETE FROM order_items WHERE order_id = :order_id
        '
    )->execute([
        ':order_id' => $order_id
    ]);

    $order_item_prep = db()->prepare(
        '
            INSERT INTO order_items (
                id,
                order_id,
                addon_id,
                title,
                addon_type,
                price,
                currency,
                date_time
            ) VALUES (
                UUID(),
                :order_id,
                :addon_id,
                :title,
                :addon_type,
                :price,
                :currency,
                :date_time
            )
            '
    );
    foreach ($selected_addons as $addon) {
        $order_item_prep->execute([
            'order_id' => $order_id,
            'addon_id' => $addon['id'],
            'title' => $addon['title'],
            'addon_type' => $addon['addon_type'],
            'price' => $addon['price'],
            'currency' => $currency->value,
            'date_time' => $addon['date_time']
        ]);
    }

    return $order_id;
}

function check_order_status(string $form_id, ?string $submission_id): ?string
{
    if (empty($submission_id)) {
        return null;
    }

    $existing_order = fetch_order_by_submission_id($form_id, $submission_id);
    if (empty($existing_order)) {
        return null;
    }

    if (
        OrderStatus::from($existing_order['status']) === OrderStatus::CONFIRMED ||
        OrderStatus::from($existing_order['status']) === OrderStatus::ON_SITE
    ) {
        throw new Exception("orden ya ha sido confirmada, no puede ser modificada");
    }

    return $existing_order['id'];
}

function update_and_fetch_order_for_payment(
    string $form_id,
    string $order_id,
    string $submission_id,
    OrderStatus $status,
): array {
    // Remove Early Bird discount if payment is ON_SITE
    if ($status === OrderStatus::ON_SITE) {
        db()->prepare(
            "DELETE FROM order_items WHERE order_id = :order_id AND addon_type = 'EARLY_DISCOUNT'"
        )->execute(
            [':order_id' => $order_id]
        );
    }

    $order_items = fetch_order_items_by_order_id($order_id);
    if (empty($order_items)) {
        throw new Exception('No hay ningun elemento seleccionado');
    }

    $total = calculate_total($order_items);
    db()->prepare(
        '
        UPDATE orders
        SET
            status = :status,
            amount = :amount
        WHERE
            id = :id
        '
    )->execute([
        'id' => $order_id,
        'status' => (float) $total === 0.0 ? OrderStatus::CONFIRMED->value : $status->value,
        'amount' => (float) $total,
    ]);

    return fetch_order_by_submission_id($form_id, $submission_id);
}

function upsert_payment(
    string $payment_id,
    string $order_id,
    ?string $charge_id,
    ?PaymentStatus $payment_status,
    ?float $amount,
    ?Currency $currency,
    ?PaymentType $payment_type,
    ?string $method,
    ?string $error_message,
    ?string $json_data,
): string {
    $id = empty($payment_id) ? guidv4() : $payment_id;
    db()->prepare(
        '
        INSERT INTO payments (
            id,
            order_id,
            status,
            amount,
            currency,
            method,
            gateway_id,
            provider,
            error_message,
            meta
        ) VALUES (
            :id,
            :order_id,
            :status,
            :amount,
            :currency,
            :method,
            :gateway_id,
            :provider,
            :error_message,
            :meta
        ) ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            amount = VALUES(amount),
            currency = VALUES(currency),
            method = VALUES(method),
            gateway_id = VALUES(gateway_id),
            provider = VALUES(provider),
            error_message = VALUES(error_message),
            meta = VALUES(meta)
        '
    )->execute([
        'id' => $id,
        'order_id' => $order_id,
        'status' => (float) $amount === 0.0 ?
            PaymentStatus::EXEMPT->value :
            $payment_status?->value ?? PaymentStatus::PENDING->value,
        'amount' => $amount ?? 0.0,
        'currency' => $currency?->value ?? Currency::PEN->value,
        'method' => $method ?: 'CASH',
        'gateway_id' => $charge_id ?? '',
        'provider' => $payment_type?->value ?? PaymentType::ON_SITE->value,
        'error_message' => $error_message ?? '',
        'meta' => $json_data ?? '{}',
    ]);

    return $id;
}
