<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';
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
    ensureAccountVerificationTable($db);

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

function ensureAccountVerificationTable(PDO $db): void
{
    $db->exec(
        'CREATE TABLE IF NOT EXISTS account_verification_codes (
            Verification_ID SERIAL PRIMARY KEY,
            Email VARCHAR(190) NOT NULL,
            Role VARCHAR(20) NOT NULL CHECK (Role IN (\'student\', \'faculty\')),
            Token CHAR(64) NOT NULL UNIQUE,
            Code_Hash VARCHAR(255) NOT NULL,
            Expires_At TIMESTAMP NOT NULL,
            Verified_At TIMESTAMP NULL,
            Consumed_At TIMESTAMP NULL,
            Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );
    $db->exec('CREATE INDEX IF NOT EXISTS idx_account_verification_token ON account_verification_codes (Token)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_account_verification_email_role ON account_verification_codes (Email, Role, Consumed_At)');
}
