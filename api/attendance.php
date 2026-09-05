<?php
declare(strict_types=1);

// SYSTEM NOTE: Records or reads attendance-related API data for consultation workflows.

require __DIR__ . '/bootstrap.php';
requirePost();

$user = requireRole('faculty');
$data = input();
$action = clean((string) ($data['action'] ?? ''));

if (!in_array($action, ['check_in', 'check_out'], true)) {
    fail('Please provide a valid attendance action.');
}

try {
    $db = database();
    $profile = userProfile($db, $user['id'], 'faculty');
    if (!$profile) {
        fail('Faculty profile was not found.', 404);
    }

    $facultyId = (int) $profile['profile_id'];
    $today = date('Y-m-d');
    $now = date('H:i:s');

    if ($action === 'check_in') {
        $statement = $db->prepare(
            'INSERT INTO attendance_logs (Faculty_ID, Date, Check_In)
             VALUES (?, ?, ?)
             RETURNING Log_ID AS "Log_ID"'
        );
        $statement->execute([$facultyId, $today, $now]);
        reply(['ok' => true, 'id' => (int) $statement->fetchColumn(), 'checked_in_at' => $now], 201);
    }

    $statement = $db->prepare(
        'UPDATE attendance_logs
         SET Check_Out = ?
         WHERE Log_ID = (
            SELECT Log_ID
            FROM attendance_logs
            WHERE Faculty_ID = ? AND Date = ? AND Check_Out IS NULL
            ORDER BY Log_ID DESC
            LIMIT 1
         )'
    );
    $statement->execute([$now, $facultyId, $today]);

    if ($statement->rowCount() === 0) {
        fail('No active check-in record was found.', 404);
    }

    reply(['ok' => true, 'checked_out_at' => $now]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to save attendance.', 500);
}
