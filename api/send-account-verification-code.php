<?php
declare(strict_types=1);

require __DIR__ . '/api-helpers.php';
require __DIR__ . '/email-delivery-helpers.php';
requirePost();

set_time_limit(20);

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? $data['identifier'] ?? '')));
$method = clean((string) ($data['method'] ?? 'email'));

if (!in_array($role, ['student', 'faculty'], true) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Please enter a valid email address.');
}

if ($method !== '' && $method !== 'email') {
    fail('Mobile number verification is no longer available. Please verify using your email address.', 400);
}

try {
    $db = database();

    $existing = $db->prepare('SELECT 1 FROM users WHERE LOWER(Email) = ? LIMIT 1');
    $existing->execute([$email]);
    if ($existing->fetchColumn()) {
        fail('An account with that email already exists.', 409);
    }

    $otpCode = (string) random_int(100000, 999999);
    $token = bin2hex(random_bytes(32));

    $insert = $db->prepare(
        'INSERT INTO account_verification_codes (Email, Role, Token, Code_Hash, Expires_At)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP + INTERVAL \'2 hours\')'
    );
    $insert->execute([
        $email,
        $role,
        $token,
        password_hash($otpCode, PASSWORD_DEFAULT),
    ]);

    try {
        sendOtpEmail($email, 'Prof Consult User', $otpCode);
    } catch (Throwable $exception) {
        // A failed resend must not invalidate the code already in the user's inbox.
        $delete = $db->prepare('DELETE FROM account_verification_codes WHERE Token = ?');
        $delete->execute([$token]);
        throw $exception;
    }

    $expireOld = $db->prepare(
        'UPDATE account_verification_codes
         SET Consumed_At = NOW()
         WHERE Email = ? AND Role = ? AND Consumed_At IS NULL AND Token <> ?'
    );
    $expireOld->execute([$email, $role, $token]);

    reply([
        'ok' => true,
        'message' => 'Verification code sent.',
        'token' => $token,
        'sent_to' => 'email',
    ]);
} catch (RuntimeException $exception) {
    fail($exception->getMessage(), 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    fail('Unable to send verification code right now.', 500);
}
