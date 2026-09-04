<?php
declare(strict_types=1);

// SYSTEM NOTE: Updates a logged-in user password after validating the current password.

require __DIR__ . '/bootstrap.php';
requirePost();

$user = currentUser();
$data = input();
$currentPassword = (string) ($data['current_password'] ?? '');
$newPassword = (string) ($data['new_password'] ?? '');

if ($currentPassword === '' || !validPassword($newPassword)) {
    fail('Please provide your current password and a valid new password.');
}

try {
    $db = database();
    $statement = $db->prepare('SELECT Password FROM users WHERE User_ID = ? LIMIT 1');
    $statement->execute([$user['id']]);
    $record = $statement->fetch();

    if (!$record || !password_verify($currentPassword, $record['Password'])) {
        fail('Current password is incorrect.', 401);
    }

    $update = $db->prepare('UPDATE users SET Password = ? WHERE User_ID = ?');
    $update->execute([password_hash($newPassword, PASSWORD_DEFAULT), $user['id']]);

    reply(['ok' => true, 'message' => 'Password changed.']);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to change password.', 500);
}
