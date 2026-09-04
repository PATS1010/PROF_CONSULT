<?php
declare(strict_types=1);

// SYSTEM NOTE: Creates a reset code and emails it to the user.

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';
requirePost();

// Receives an email/mobile number, creates a 6-digit OTP, stores only its hash, then emails the code.

$data = input();
$identifier = strtolower(clean((string) ($data['identifier'] ?? '')));
$role = clean((string) ($data['role'] ?? 'student'));

if ($identifier === '' || !in_array($role, ['student', 'faculty'], true)) {
    fail('Please enter your registered email address or mobile number.');
}

$emailCandidate = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? $identifier : '';
$phoneCandidate = preg_replace('/\D/', '', $identifier);

try {
    $db = database();
    ensurePasswordResetTable($db);

    $lookup = $db->prepare(
        'SELECT User_ID, Full_Name, Email
         FROM users
         WHERE Role = ?
           AND (LOWER(Email) = ? OR Mobile_Number = ?)
           AND Account_Status = ?
         LIMIT 1'
    );
    $lookup->execute([$role, $emailCandidate, $phoneCandidate, 'active']);
    $user = $lookup->fetch();

    if (!$user) {
        fail('No active account was found for that email or mobile number.', 404);
    }

    $otpCode = (string) random_int(100000, 999999);
    $token = bin2hex(random_bytes(32));

    // Old unused codes for this user are marked consumed before creating a fresh OTP.
    $expireOld = $db->prepare('UPDATE password_reset_codes SET Consumed_At = NOW() WHERE User_ID = ? AND Consumed_At IS NULL');
    $expireOld->execute([(int) $user['User_ID']]);

    $insert = $db->prepare(
        'INSERT INTO password_reset_codes (User_ID, Token, Code_Hash, Expires_At)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
    );
    $insert->execute([
        (int) $user['User_ID'],
        $token,
        password_hash($otpCode, PASSWORD_DEFAULT),
    ]);

    sendOtpEmail((string) $user['Email'], (string) $user['Full_Name'], $otpCode);

    reply([
        'ok' => true,
        'message' => 'Verification code sent.',
        'token' => $token,
    ]);
} catch (RuntimeException $exception) {
    fail($exception->getMessage(), 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    fail('Unable to create a verification code right now.', 500);
}

function ensurePasswordResetTable(PDO $db): void
{
    // Creates the OTP table automatically if the current local database has not been updated yet.
    $db->exec(
        'CREATE TABLE IF NOT EXISTS password_reset_codes (
            Reset_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            User_ID INT UNSIGNED NOT NULL,
            Token CHAR(64) NOT NULL UNIQUE,
            Code_Hash VARCHAR(255) NOT NULL,
            Expires_At DATETIME NOT NULL,
            Verified_At DATETIME NULL,
            Consumed_At DATETIME NULL,
            Created_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_password_reset_user
                FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE,
            INDEX idx_password_reset_token (Token),
            INDEX idx_password_reset_user_active (User_ID, Consumed_At)
        ) ENGINE=InnoDB'
    );
}
