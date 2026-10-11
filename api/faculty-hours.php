<?php
declare(strict_types=1);

// SYSTEM NOTE: Saves and returns the logged-in faculty member's weekly consultation hours.

require __DIR__ . '/bootstrap.php';

$db = database();

try {
    $user = requireRole('faculty');
    $profile = userProfile($db, (int) $user['id'], 'faculty');

    if (!$profile) {
        fail('Faculty profile was not found.', 404);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        reply([
            'ok' => true,
            'consultation_hours' => $profile['Consultation_Hours'] ?? '',
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $data = input();
    $hours = trim((string) ($data['consultation_hours'] ?? ''));

    if (strlen($hours) > 2000) {
        fail('Consultation hours are too long.');
    }

    $statement = $db->prepare(
        'UPDATE faculty
         SET Consultation_Hours = ?
         WHERE Faculty_ID = ?'
    );
    $statement->execute([
        $hours !== '' ? $hours : null,
        (int) $profile['profile_id'],
    ]);

    reply(['ok' => true, 'consultation_hours' => $hours]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to save consultation hours.', 500);
}
