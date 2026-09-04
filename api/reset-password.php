<?php
declare(strict_types=1);

// SYSTEM NOTE: Applies a verified password reset code to set a new password.

require __DIR__ . '/bootstrap.php';
requirePost();

// Saves the new password after the OTP token has already been verified.

$data = input();
$token = clean((string) ($data['token'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($token === '' || !validPassword($password)) {
    fail('Please provide a valid reset token and password.');
}

try {
    $db = database();
    $db->beginTransaction();

    $lookup = $db->prepare(
        'SELECT User_ID
         FROM password_reset_codes
         WHERE Token = ? AND Verified_At IS NOT NULL AND Consumed_At IS NULL AND Expires_At >= NOW()
         LIMIT 1'
    );
    $lookup->execute([$token]);
    $reset = $lookup->fetch();

    if (!$reset) {
        $db->rollBack();
        fail('Your reset session expired. Please request a new code.', 410);
    }

    $updatePassword = $db->prepare('UPDATE users SET Password = ? WHERE User_ID = ?');
    $updatePassword->execute([password_hash($password, PASSWORD_DEFAULT), (int) $reset['User_ID']]);

    // Consuming the token prevents the same reset link from being reused.
    $consume = $db->prepare('UPDATE password_reset_codes SET Consumed_At = NOW() WHERE Token = ?');
    $consume->execute([$token]);

    $db->commit();

    reply(['ok' => true, 'message' => 'Password reset successfully.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('Unable to reset password right now.', 500);
}
