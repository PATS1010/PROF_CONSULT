<?php
declare(strict_types=1);

// SYSTEM NOTE: Lets a logged-in faculty member view a student's public profile by student number.

require __DIR__ . '/api-helpers.php';

requireRole('faculty');

$studentNumber = clean((string) ($_GET['student_number'] ?? ''));
if ($studentNumber === '') {
    fail('Please provide a student number.');
}

try {
    $db = database();

    $statement = $db->prepare(
        'SELECT
            u.Username AS "Student_Number",
            u.Full_Name AS "Full_Name",
            u.Email AS "Email",
            u.Mobile_Number AS "Mobile_Number",
            u.Profile_Photo AS "Profile_Photo",
            s.Program AS "Program",
            s.Year_Level AS "Year_Level",
            s.Section AS "Section"
         FROM students s
         INNER JOIN users u ON u.User_ID = s.User_ID
         WHERE u.Username = ? AND u.Role = ? AND u.Account_Status = ?
         LIMIT 1'
    );
    $statement->execute([$studentNumber, 'student', 'active']);
    $profile = $statement->fetch();

    if (!$profile) {
        fail('Student profile was not found.', 404);
    }

    reply(['ok' => true, 'profile' => $profile]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load the student profile.', 500);
}
