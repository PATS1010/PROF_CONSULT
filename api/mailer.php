<?php
declare(strict_types=1);

// SYSTEM NOTE: Builds and sends email messages for OTP verification flows.

// Uses Brevo's HTTPS API so Railway does not need outbound SMTP ports.

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once dirname(__DIR__) . '/vendor/autoload.php';

function sendOtpEmail(string $toEmail, string $toName, string $otpCode): void
{
    if (BREVO_API_KEY === '') {
        throw new RuntimeException('BREVO_API_KEY is not configured in Railway.');
    }

    sendOtpEmailWithBrevoApi($toEmail, $toName, $otpCode);
}

function otpEmailHtml(string $toName, string $otpCode): string
{
    return '
        <p>Hello ' . htmlspecialchars($toName, ENT_QUOTES, 'UTF-8') . ',</p>
        <p>Your Prof Consult verification code is:</p>
        <h2 style="letter-spacing: 4px;">' . htmlspecialchars($otpCode, ENT_QUOTES, 'UTF-8') . '</h2>
        <p>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
    ';
}

function otpEmailText(string $otpCode): string
{
    return "Your Prof Consult verification code is {$otpCode}. This code will expire in 10 minutes.";
}

function brevoErrorMessage(?string $response): string
{
    $fallback = 'Brevo rejected the email request. Check BREVO_API_KEY and SMTP_FROM_EMAIL.';
    if (!$response) {
        return $fallback;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        return $fallback;
    }

    $message = (string) ($data['message'] ?? '');
    $code = (string) ($data['code'] ?? '');

    if ($message === '') {
        return $fallback;
    }

    return $code !== ''
        ? "Brevo rejected the email request ({$code}): {$message}"
        : "Brevo rejected the email request: {$message}";
}

function sendOtpEmailWithBrevoApi(string $toEmail, string $toName, string $otpCode): void
{
    if (SMTP_FROM_EMAIL === '') {
        throw new RuntimeException('SMTP_FROM_EMAIL is not configured.');
    }

    $payload = [
        'sender' => [
            'name' => SMTP_FROM_NAME,
            'email' => SMTP_FROM_EMAIL,
        ],
        'to' => [
            [
                'email' => $toEmail,
                'name' => $toName,
            ],
        ],
        'subject' => 'Your Prof Consult verification code',
        'htmlContent' => otpEmailHtml($toName, $otpCode),
        'textContent' => otpEmailText($otpCode),
    ];

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Accept: application/json',
                'Content-Type: application/json',
                'api-key: ' . BREVO_API_KEY,
            ],
            'content' => json_encode($payload),
            'ignore_errors' => true,
            'timeout' => 15,
        ],
    ]);

    $response = file_get_contents('https://api.brevo.com/v3/smtp/email', false, $context);
    $statusLine = $http_response_header[0] ?? '';

    if (!preg_match('/\s2\d\d\s/', $statusLine)) {
        error_log('Brevo email failed: ' . $statusLine . ' ' . (string) $response);
        throw new RuntimeException(brevoErrorMessage($response === false ? null : $response));
    }
}

function sendOtpEmailWithSmtp(string $toEmail, string $toName, string $otpCode): void
{
    if (SMTP_USERNAME === '' || SMTP_PASSWORD === '' || SMTP_FROM_EMAIL === '') {
        throw new RuntimeException('Email environment variables are not configured.');
    }

    ini_set('default_socket_timeout', '10');

    $mail = new PHPMailer(true);

    try {
        // Connect PHPMailer to the SMTP account configured in api/config.php.
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->Timeout = 10;
        $mail->SMTPKeepAlive = false;
        $mail->SMTPSecure = SMTP_ENCRYPTION === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;

        // Prepare the recipient and sender information for the OTP email.
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        // The HTML body is what most email apps show; AltBody is the plain-text fallback.
        $mail->isHTML(true);
        $mail->Subject = 'Your Prof Consult verification code';
        $mail->Body = otpEmailHtml($toName, $otpCode);
        $mail->AltBody = otpEmailText($otpCode);

        $mail->send();
    } catch (Exception $exception) {
        error_log('OTP email failed: ' . $mail->ErrorInfo);
        throw new RuntimeException('Unable to send verification code. Please check the email service settings.');
    }
}
