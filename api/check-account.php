<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
requirePost();

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$username = clean((string) ($data['id_number'] ?? $data['username'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? '')));

if (!in_array($role, ['student', 'faculty'], true) || ($username === '' && $email === '')) {
    fail('Please provide account details to check.');
}

try {
    $db = database();

    $usernameExists = false;
    if ($username !== '') {
        $checkUsername = $db->prepare(
            'SELECT 1
             FROM users
             WHERE Role = ? AND Username = ?
             LIMIT 1'
        );
        $checkUsername->execute([$role, $username]);
        $usernameExists = (bool) $checkUsername->fetchColumn();
    }

    $emailExists = false;
    if ($email !== '') {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('Please provide a valid email address.');
        }

        $checkEmail = $db->prepare(
            'SELECT 1
             FROM users
             WHERE Role = ? AND LOWER(Email) = ?
             LIMIT 1'
        );
        $checkEmail->execute([$role, $email]);
        $emailExists = (bool) $checkEmail->fetchColumn();
    }

    reply([
        'ok' => true,
        'exists' => $usernameExists || $emailExists,
        'username_exists' => $usernameExists,
        'email_exists' => $emailExists,
    ]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to check account details right now.', 500);
}
