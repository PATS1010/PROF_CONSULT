<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$facultyId = (int) ($_GET['faculty_id'] ?? 0);
$date = clean((string) ($_GET['date'] ?? ''));
$excludeRequestId = (int) ($_GET['request_id'] ?? 0);

try {
    $db = database();

    if ($facultyId <= 0) {
        $sessionUser = currentUser('faculty');
        $sessionProfile = userProfile($db, $sessionUser['id'], 'faculty');
        $facultyId = (int) ($sessionProfile['profile_id'] ?? 0);
    }

    if ($facultyId <= 0) {
        fail('Please choose a faculty member.', 400);
    }

    // Only the owning professor may free the current booking in a reschedule view.
    if ($excludeRequestId > 0) {
        $owner = requireRole('faculty');
        $owned = $db->prepare(
            'SELECT cr.Request_ID FROM consultation_requests cr
             INNER JOIN faculty f ON f.Faculty_ID = cr.Faculty_ID
             WHERE cr.Request_ID = ? AND cr.Faculty_ID = ? AND f.User_ID = ?'
        );
        $owned->execute([$excludeRequestId, $facultyId, $owner['id']]);
        if (!$owned->fetchColumn()) {
            fail('Consultation request was not found.', 404);
        }
    }

    $faculty = $db->prepare(
        'SELECT Consultation_Hours AS "Consultation_Hours"
         FROM faculty
         WHERE Faculty_ID = ?
         LIMIT 1'
    );
    $faculty->execute([$facultyId]);
    $record = $faculty->fetch();

    if (!$record) {
        fail('Faculty member was not found.', 404);
    }

    $weeklyHours = parseWeeklyHours((string) ($record['Consultation_Hours'] ?? ''));
    $response = [
        'ok' => true,
        'days' => availableDayNumbers($weeklyHours),
        'day_names' => availableDayNames($weeklyHours),
    ];

    if ($date !== '') {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            fail('Please choose a valid date.', 400);
        }

        $dateTime = DateTimeImmutable::createFromFormat('Y-m-d', $date);
        if (!$dateTime || $dateTime->format('Y-m-d') !== $date) {
            fail('Please choose a valid date.', 400);
        }

        $dayNumber = (int) $dateTime->format('N');
        if ($dayNumber < 1 || $dayNumber > 6) {
            $response['slots'] = [];
            $response['message'] = 'Consultations are available from Monday to Saturday only.';
            reply($response);
        }

        $dayName = $dateTime->format('l');
        $availableStarts = $weeklyHours[$dayName] ?? [];
        $takenStarts = bookedStarts($db, $facultyId, $date, $excludeRequestId);

        $response['slots'] = array_map(
            static fn (string $start): array => [
                'label' => slotLabel($start),
                'value' => slotLabel($start),
                'start' => $start,
                'available' => in_array($start, $availableStarts, true),
                'taken' => in_array($start, $takenStarts, true),
            ],
            dailySlotStarts()
        );
    }

    reply($response);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load the faculty schedule.', 500);
}
