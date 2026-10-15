<?php
declare(strict_types=1);

// SYSTEM NOTE: Creates a student consultation request for the selected faculty member.

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mailer.php';
requirePost();

$user = requireRole('student');
releaseSessionLock();
$data = input();
$facultyId = (int) ($data['faculty_id'] ?? 0);
$purpose = clean((string) ($data['purpose'] ?? ''));
$message = clean((string) ($data['message'] ?? ''));
$date = clean((string) ($data['preferred_date'] ?? ''));
$time = clean((string) ($data['preferred_time'] ?? ''));

if ($facultyId <= 0 || $purpose === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $time === '') {
    fail('Please complete all required request fields.');
}

$preferredTimeStart = preferredTimeStart($time);
if ($preferredTimeStart < '07:00:00' || $preferredTimeStart >= '19:00:00') {
    fail('Preferred time must be between 7:00 AM and 7:00 PM.');
}

$scheduledStart = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $preferredTimeStart);
$now = new DateTimeImmutable('now');

if (!$scheduledStart || $scheduledStart->format('Y-m-d H:i:s') !== $date . ' ' . $preferredTimeStart || $scheduledStart <= $now) {
    fail('Preferred date and time must be in the future.');
}

try {
    $db = database();

    $student = userProfile($db, $user['id'], 'student');
    if (!$student) {
        fail('Student profile was not found.', 404);
    }

    $faculty = $db->prepare(
        'SELECT
            f.Faculty_ID AS "Faculty_ID",
            f.User_ID AS "User_ID",
            f.Consultation_Hours AS "Consultation_Hours",
            u.Full_Name AS "Full_Name",
            u.Email AS "Email"
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

    $scheduledDayNumber = (int) $scheduledStart->format('N');
    if ($scheduledDayNumber < 1 || $scheduledDayNumber > 6) {
        fail('Consultations are available from Monday to Saturday only.', 422);
    }
    $weeklyHours = parseWeeklyHours((string) ($facultyRecord['Consultation_Hours'] ?? ''));
    $scheduledDayName = $scheduledStart->format('l');
    if (!in_array($preferredTimeStart, $weeklyHours[$scheduledDayName] ?? [], true)) {
        fail('That time is not available for the selected professor. Please choose an available slot.', 422);
    }

    $db->beginTransaction();

    $lock = $db->prepare('SELECT pg_advisory_xact_lock(hashtext(?))');
    $lock->execute(['consultation-slot:' . $facultyId . ':' . $date . ':' . $preferredTimeStart]);

    $conflict = $db->prepare(
        "SELECT 1
         FROM consultation_requests
         WHERE Faculty_ID = ?
           AND Request_Date = ?
           AND Preferred_Time = ?
           AND Status IN ('pending', 'approved', 'rescheduled')
         LIMIT 1"
    );
    $conflict->execute([$facultyId, $date, $preferredTimeStart]);
    if ($conflict->fetchColumn()) {
        $db->rollBack();
        fail('This time slot has already been taken. Please choose another available time.', 409);
    }

    $statement = $db->prepare(
        'INSERT INTO consultation_requests
            (Student_ID, Faculty_ID, Purpose, Additional_Message, Request_Date, Preferred_Time, Status, Response)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING Request_ID AS "Request_ID"'
    );
    $statement->execute([
        (int) $student['profile_id'],
        $facultyId,
        $purpose,
        $message !== '' ? $message : null,
        $date,
        $preferredTimeStart,
        'pending',
        null,
    ]);
    $requestId = (int) $statement->fetchColumn();

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

    if (userWantsEmailNotifications($db, (int) $facultyRecord['User_ID'])) {
        try {
            sendNotificationEmail(
                (string) $facultyRecord['Email'],
                (string) $facultyRecord['Full_Name'],
                'New consultation request',
                $user['name'] . ' sent you a consultation request for ' . formatConsultationSchedule($date, $preferredTimeStart) . '.'
            );
        } catch (Throwable $exception) {
            error_log('Consultation request email failed: ' . $exception->getMessage());
        }
    }

    reply(['ok' => true, 'id' => $requestId], 201);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('A database error occurred. Check config.php and import database/schema.sql.', 500);
}

function formatConsultationSchedule(string $date, string $time): string
{
    $dateTime = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time);
    if (!$dateTime) {
        return 'the selected schedule';
    }

    return $dateTime->format('F j, Y \a\t g:i A');
}
