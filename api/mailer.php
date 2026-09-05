<?php
declare(strict_types=1);

// SYSTEM NOTE: Builds and sends email messages for password reset flows.

// Builds and sends OTP emails using PHPMailer so password reset codes are delivered through SMTP.

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once dirname(__DIR__) . '/vendor/autoload.php';

function sendOtpEmail(string $toEmail, string $toName, string $otpCode): void
{
    if (SMTP_USERNAME === '' || SMTP_PASSWORD === '' || SMTP_FROM_EMAIL === '') {
        throw new RuntimeException('SMTP environment variables are not configured.');
    }

    $mail = new PHPMailer(true);

    try {
        // Connect PHPMailer to the SMTP account configured in api/config.php.
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
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
        $mail->Body = '
            <p>Hello ' . htmlspecialchars($toName, ENT_QUOTES, 'UTF-8') . ',</p>
            <p>Your Prof Consult verification code is:</p>
            <h2 style="letter-spacing: 4px;">' . htmlspecialchars($otpCode, ENT_QUOTES, 'UTF-8') . '</h2>
            <p>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
        ';
        $mail->AltBody = "Your Prof Consult verification code is {$otpCode}. This code will expire in 10 minutes.";

        $mail->send();
    } catch (Exception $exception) {
        error_log('OTP email failed: ' . $mail->ErrorInfo);
        throw new RuntimeException('Unable to send verification code right now.');
    }
}
