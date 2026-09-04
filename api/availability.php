<?php
declare(strict_types=1);

// SYSTEM NOTE: Saves and returns faculty availability status for professor and student dashboards.

require __DIR__ . '/bootstrap.php';

$db = database();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $sessionUser = requireRole('faculty');
        ensureProfilePhotoColumn($db);
        $refreshUser = $db->prepare(
            'SELECT User_ID, Username, Full_Name, Email, Mobile_Number, Profile_Photo, Role
             FROM users
             WHERE User_ID = ? AND Account_Status = ?
             LIMIT 1'
        );
        $refreshUser->execute([(int) $sessionUser['id'], 'active']);
        $record = $refreshUser->fetch();

        if (!$record) {
            fail('Please log in first.', 401);
        }

        $user = rememberUserSession(publicUser($record));

        if ($user['role'] !== 'faculty') {
            fail('Please log in with a faculty account to change availability.', 403);
        }

        $profile = userProfile($db, $user['id'], 'faculty');
        if (!$profile) {
            fail('Faculty profile was not found.', 404);
        }

        $data = input();
        $status = clean((string) ($data['status'] ?? ''));
        $date = clean((string) ($data['date'] ?? date('Y-m-d')));
        $time = clean((string) ($data['time'] ?? date('H:i:s')));
        $allowedStatuses = ['available', 'unavailable', 'in class', 'meeting', 'on leave', 'consultation', 'offline'];

        if (!in_array($status, $allowedStatuses, true)
            || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            fail('Please provide valid availability details.');
        }

        $statement = $db->prepare(
            'INSERT INTO availability (Faculty_ID, Status, Date, Time)
             VALUES (?, ?, ?, ?)'
        );
        $statement->execute([(int) $profile['profile_id'], $status, $date, preferredTimeStart($time)]);
        reply(['ok' => true, 'id' => (int) $db->lastInsertId()], 201);
    }

    $facultyId = (int) ($_GET['faculty_id'] ?? 0);
    $date = clean((string) ($_GET['date'] ?? date('Y-m-d')));

    if ($facultyId <= 0) {
        $requestedRole = clean((string) ($_GET['role'] ?? ''));
        $user = $requestedRole === 'faculty' ? currentUser('faculty') : currentUser();
        if ($user['role'] !== 'faculty') {
            fail('Please provide a faculty ID.');
        }
        $profile = userProfile($db, $user['id'], 'faculty');
        $facultyId = (int) ($profile['profile_id'] ?? 0);
    }

    $statement = $db->prepare(
        'SELECT Availability_ID, Faculty_ID, Status, Date, Time
         FROM availability
         WHERE Faculty_ID = ? AND Date = ?
         ORDER BY Time'
    );
    $statement->execute([$facultyId, $date]);
    reply(['ok' => true, 'availability' => $statement->fetchAll()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to save or load availability.', 500);
}
