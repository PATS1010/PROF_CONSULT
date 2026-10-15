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
