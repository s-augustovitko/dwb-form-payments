<?php

declare(strict_types=1);

/**
 * Renders the HTML content for the payment success email.
 *
 * @param array $submission Submission data
 * @param array $order Order data
 * @param array $items Order items to count sessions and meals
 * @return string HTML email body
 */
function render_payment_email(
    array $submission,
    array $order,
    array $items,
): string {
    $sessions = count(
        array_filter($items, fn($i) => ($i["addon_type"] ?? "") === "SESSION"),
    );
    $meals = count(
        array_filter($items, fn($i) => ($i["addon_type"] ?? "") === "MEAL"),
    );
    $amount = $order["amount"];
    $currency = $order["currency"] ?? "PEN";

    // Bank details for transfer
    $bank_name = getenv("BANK_NAME");
    $bank_account = getenv("BANK_ACCOUNT");
    $cci = getenv("BANK_CCI");
    $reply_email = getenv("EMAIL_REPLY");

    $first_name = $submission["first_name"] ?? "Usuario";

    $bank_section = "";
    if ($bank_name && $bank_account && $cci) {
        $bank_section = "
        <p><strong>Información para transferencias bancarias:</strong><br>
        En caso de que desees realizar pagos futuros o transferencias, utiliza los siguientes datos:<br>
        Banco: {$bank_name}<br>
        Cuenta: {$bank_account}<br>
        CCI: {$cci}</p>";

        if ($reply_email) {
            $bank_section .= "<p>Una vez realizado el pago, por favor envía el comprobante a: <a href='mailto:{$reply_email}'>{$reply_email}</a></p>";
        }
    }

    $reply_section = "";
    if ($reply_email) {
        $reply_section = "<p>Para cualquier consulta contactanos a: <a href='mailto:{$reply_email}'>{$reply_email}</a></p>";
    }

    return "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
            <h2 style='color: #2c3e50; text-align: center;'>¡Registro y pago exitosos!</h2>
            <p>Hola <strong>{$first_name}</strong>,</p>
            <p>Tu inscripción fue correctamente completada. Por favor guarda este correo como comprobante y muéstralo en el curso.</p>

            <div style='background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <p><strong>Nombre:</strong> {$submission["first_name"]} {$submission["last_name"]}</p>
                <p><strong>Orden:</strong> {$order["id"]}</p>
                <p><strong>Respuesta:</strong> {$submission["id"]}</p>
                <p><strong>Correo:</strong> {$submission["email"]}</p>
                <hr style='border: 0; border-top: 1px solid #ddd; margin: 10px 0;'>
                <p><strong>Número de Sesiones:</strong> {$sessions}</p>
                <p><strong>Número de Comidas:</strong> {$meals}</p>
                <p><strong>Monto:</strong> {$amount} {$currency}</p>
            </div>

            {$reply_section}

            {$bank_section}

            <p style='text-align: center; margin-top: 30px;'><strong>¡Te esperamos!</strong></p>
        </div>
    </body>
    </html>
    ";
}
