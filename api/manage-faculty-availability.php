<?php
declare(strict_types=1);

// SYSTEM NOTE: Saves and returns faculty availability status for professor and student dashboards.

require __DIR__ . '/api-helpers.php';
currentUser();

$db = database();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $sessionUser = requireRole('faculty');
        $refreshUser = $db->prepare(
            'SELECT
                User_ID AS "User_ID",
                Username AS "Username",
                Full_Name AS "Full_Name",
                Email AS "Email",
                Mobile_Number AS "Mobile_Number",
                Profile_Photo AS "Profile_Photo",
                Role AS "Role"
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
        if ($status === 'online') {
            $status = 'available';
        }
        $now = currentManilaDateTime();
        // A device clock must not make a newly saved status sort behind an old one.
        $date = $now->format('Y-m-d');
        $time = $now->format('H:i:s');
        $allowedStatuses = ['available', 'meeting', 'on leave', 'consultation', 'offline'];

        if (!in_array($status, $allowedStatuses, true)
            || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            fail('Please provide valid availability details.');
        }
        $pageId = clean((string) ($data['page_id'] ?? 'status-update'));
        if (!preg_match('/^[a-zA-Z0-9-]{1,64}$/', $pageId)) fail('Please provide a valid page ID.');

        $db->beginTransaction();
        $statement = $db->prepare(
            'INSERT INTO availability (Faculty_ID, Status, Date, Time)
             VALUES (?, ?, ?, ?)
             RETURNING Availability_ID AS "Availability_ID"'
        );
        $statement->execute([(int) $profile['profile_id'], $status, $date, preferredTimeStart($time)]);
        $id = (int) $statement->fetchColumn();
        $statement->closeCursor();
        touchFacultyPresence($db, (int) $profile['profile_id'], $pageId, $status !== 'offline');
        $db->commit();
        reply(['ok' => true, 'id' => $id, 'status' => facultyCurrentStatus($db, (int) $profile['profile_id']), 'checked_in' => facultyCheckedIn($db, (int) $profile['profile_id'])], 201);
    }

    $facultyId = (int) ($_GET['faculty_id'] ?? 0);
    $date = clean((string) ($_GET['date'] ?? currentManilaDateTime()->format('Y-m-d')));
    $latestOnly = clean((string) ($_GET['latest'] ?? '')) === '1';

    if ($facultyId <= 0) {
        $requestedRole = clean((string) ($_GET['role'] ?? ''));
        $user = $requestedRole === 'faculty' ? currentUser('faculty') : currentUser();
        if ($user['role'] !== 'faculty') {
            fail('Please provide a faculty ID.');
        }
        $profile = userProfile($db, $user['id'], 'faculty');
        $facultyId = (int) ($profile['profile_id'] ?? 0);
    }

    if ($latestOnly) {
        $statement = $db->prepare(
            'SELECT
                Availability_ID AS "Availability_ID",
                Faculty_ID AS "Faculty_ID",
                Status AS "Status",
                Date AS "Date",
                Time AS "Time"
             FROM availability
             WHERE Faculty_ID = ?
             ORDER BY Availability_ID DESC
             LIMIT 1'
        );
        $statement->execute([$facultyId]);
    } else {
        $statement = $db->prepare(
            'SELECT
                Availability_ID AS "Availability_ID",
                Faculty_ID AS "Faculty_ID",
                Status AS "Status",
                Date AS "Date",
                Time AS "Time"
             FROM availability
             WHERE Faculty_ID = ? AND Date = ?
             ORDER BY Time'
        );
        $statement->execute([$facultyId, $date]);
    }
    $rows = $statement->fetchAll();
    if ($latestOnly) {
        $now = currentManilaDateTime();
        $rows = [[
            'Availability_ID' => $rows[0]['Availability_ID'] ?? null,
            'Faculty_ID' => $facultyId,
            'Status' => facultyCurrentStatus($db, $facultyId, $now),
            'Date' => $now->format('Y-m-d'),
            'Time' => $now->format('H:i:s'),
        ]];
    }
    reply(['ok' => true, 'availability' => $rows, 'checked_in' => facultyCheckedIn($db, $facultyId)]);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log($exception->getMessage());
    fail('Unable to save or load availability.', 500);
}
