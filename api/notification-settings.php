<?php
declare(strict_types=1);

// SYSTEM NOTE: Reads and saves per-account notification preferences.

require __DIR__ . '/bootstrap.php';

$requestBody = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $requestBody = input();
}

$requestedRole = clean((string) ($_GET['role'] ?? ($requestBody['role'] ?? '')));
$user = in_array($requestedRole, ['student', 'faculty'], true)
    ? currentUser($requestedRole)
    : currentUser();
$db = database();

try {
    ensureNotificationPreferenceColumns($db);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $emailNotifications = filter_var(
            $requestBody['email_notifications'] ?? true,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );
        $pushNotifications = filter_var(
            $requestBody['push_notifications'] ?? true,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        if ($emailNotifications === null || $pushNotifications === null) {
            fail('Please provide valid notification settings.');
        }

        $statement = $db->prepare(
            'UPDATE users
             SET Email_Notifications = ?, Push_Notifications = ?
             WHERE User_ID = ?'
        );
        $statement->bindValue(1, $emailNotifications, PDO::PARAM_BOOL);
        $statement->bindValue(2, $pushNotifications, PDO::PARAM_BOOL);
        $statement->bindValue(3, $user['id'], PDO::PARAM_INT);
        $statement->execute();
    }

    reply(['ok' => true, 'settings' => notificationPreferencesForUser($db, $user['id'])]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to save notification settings.', 500);
}
