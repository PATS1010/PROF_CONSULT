<?php
declare(strict_types=1);

// SYSTEM NOTE: Returns notification records for the currently logged-in user.

require __DIR__ . '/bootstrap.php';

$user = currentUser();
$db = database();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = input();
        $notificationId = (int) ($data['notification_id'] ?? 0);
        if ($notificationId <= 0) {
            fail('Please provide a notification ID.');
        }

        $statement = $db->prepare(
            'UPDATE notifications
             SET Read_Status = \'read\'
             WHERE Notification_ID = ? AND User_ID = ?'
        );
        $statement->execute([$notificationId, $user['id']]);
        reply(['ok' => true]);
    }

    $statement = $db->prepare(
        'SELECT
            Notification_ID AS "Notification_ID",
            Message AS "Message",
            Date_Time AS "Date_Time",
            Read_Status AS "Read_Status"
         FROM notifications
         WHERE User_ID = ?
         ORDER BY Date_Time DESC, Notification_ID DESC'
    );
    $statement->execute([$user['id']]);
    reply(['ok' => true, 'notifications' => $statement->fetchAll()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load notifications.', 500);
}
