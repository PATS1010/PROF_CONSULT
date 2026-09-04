<?php
declare(strict_types=1);

// SYSTEM NOTE: Checks whether a submitted reset code is valid before password reset.

require __DIR__ . '/bootstrap.php';
requirePost();

// Checks the submitted 6-digit OTP against the saved hash without exposing the real code.

$data = input();
$token = clean((string) ($data['token'] ?? ''));
$code = clean((string) ($data['code'] ?? ''));

if ($token === '' || !preg_match('/^\d{6}$/', $code)) {
    fail('Please enter the 6-digit verification code.');
}

try {
    $db = database();
    $lookup = $db->prepare(
        'SELECT Code_Hash
         FROM password_reset_codes
         WHERE Token = ? AND Consumed_At IS NULL AND Expires_At >= NOW()
         LIMIT 1'
    );
    $lookup->execute([$token]);
    $reset = $lookup->fetch();

    if (!$reset || !password_verify($code, $reset['Code_Hash'])) {
        fail('Incorrect or expired verification code.', 401);
    }

    // Marks the reset token as OTP-verified so api/reset-password.php can safely accept it.
    $verified = $db->prepare('UPDATE password_reset_codes SET Verified_At = NOW() WHERE Token = ?');
    $verified->execute([$token]);

    reply(['ok' => true, 'message' => 'Verification code accepted.', 'token' => $token]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to verify the code right now.', 500);
}
