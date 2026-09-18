<?php
declare(strict_types=1);

// SYSTEM NOTE: Verifies the email OTP used before account creation.

require __DIR__ . '/bootstrap.php';
requirePost();

$data = input();
$token = clean((string) ($data['token'] ?? ''));
$code = preg_replace('/\D/', '', (string) ($data['code'] ?? ''));
$role = clean((string) ($data['role'] ?? ''));

if ($token === '' || strlen($code) !== 6 || !in_array($role, ['student', 'faculty'], true)) {
    fail('Please enter a valid verification code.');
}

try {
    $db = database();
    ensureAccountVerificationTable($db);

    $lookup = $db->prepare(
        'SELECT Verification_ID AS "Verification_ID", Code_Hash AS "Code_Hash"
         FROM account_verification_codes
         WHERE Token = ?
           AND Role = ?
           AND Consumed_At IS NULL
           AND Expires_At > CURRENT_TIMESTAMP
         LIMIT 1'
    );
    $lookup->execute([$token, $role]);
    $record = $lookup->fetch();

    if (!$record || !password_verify($code, (string) $record['Code_Hash'])) {
        fail('Incorrect or expired verification code.', 422);
    }

    $update = $db->prepare(
        'UPDATE account_verification_codes
         SET Verified_At = COALESCE(Verified_At, NOW())
         WHERE Verification_ID = ?'
    );
    $update->execute([(int) $record['Verification_ID']]);

    reply(['ok' => true, 'message' => 'Account verified.']);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    fail('Unable to verify account right now.', 500);
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
