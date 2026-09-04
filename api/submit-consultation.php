<?php
declare(strict_types=1);

// SYSTEM NOTE: Creates a student consultation request for the selected faculty member.

require __DIR__ . '/bootstrap.php';
requirePost();

$user = requireRole('student');
$data = input();
$facultyId = (int) ($data['faculty_id'] ?? 0);
$purpose = clean((string) ($data['purpose'] ?? ''));
$message = clean((string) ($data['message'] ?? ''));
$date = clean((string) ($data['preferred_date'] ?? ''));
$time = clean((string) ($data['preferred_time'] ?? ''));

if ($facultyId <= 0 || $purpose === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $time === '') {
    fail('Please complete all required request fields.');
}

try {
    $db = database();
    ensureConsultationMessageColumn($db);

    $student = userProfile($db, $user['id'], 'student');
    if (!$student) {
        fail('Student profile was not found.', 404);
    }

    $faculty = $db->prepare(
        'SELECT f.Faculty_ID, f.User_ID, u.Full_Name
         FROM faculty f
         INNER JOIN users u ON u.User_ID = f.User_ID
         WHERE f.Faculty_ID = ? AND u.Role = ? AND u.Account_Status = ?
         LIMIT 1'
    );
    $faculty->execute([$facultyId, 'faculty', 'active']);
    $facultyRecord = $faculty->fetch();
    if (!$facultyRecord) {
        fail('Faculty member was not found.', 404);
    }

    $db->beginTransaction();

    $statement = $db->prepare(
        'INSERT INTO consultation_requests
            (Student_ID, Faculty_ID, Purpose, Additional_Message, Request_Date, Preferred_Time, Status, Response)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        (int) $student['profile_id'],
        $facultyId,
        $purpose,
        $message !== '' ? $message : null,
        $date,
        preferredTimeStart($time),
        'pending',
        null,
    ]);
    $requestId = (int) $db->lastInsertId();

    $notification = $db->prepare(
        'INSERT INTO notifications (User_ID, Message, Read_Status)
         VALUES (?, ?, ?)'
    );
    $notification->execute([
        (int) $facultyRecord['User_ID'],
        $user['name'] . ' sent a consultation request.',
        'unread',
    ]);

    $db->commit();
    reply(['ok' => true, 'id' => $requestId], 201);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('A database error occurred. Check config.php and import database/schema.sql.', 500);
}
