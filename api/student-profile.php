<?php
declare(strict_types=1);

// SYSTEM NOTE: Updates the logged-in student's editable profile details.

require __DIR__ . '/bootstrap.php';
requirePost();

$user = requireRole('student');
$data = input();

$fullName = clean((string) ($data['full_name'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? '')));
$phone = preg_replace('/\D/', '', (string) ($data['phone'] ?? ''));
$program = clean((string) ($data['program'] ?? ''));
$yearLevel = clean((string) ($data['year_level'] ?? ''));
$section = clean((string) ($data['section'] ?? ''));

if ($fullName === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($phone) !== 10
    || $program === ''
    || $yearLevel === ''
    || $section === '') {
    fail('Please provide valid student profile details.');
}

try {
    $db = database();
    $db->beginTransaction();

    $emailCheck = $db->prepare(
        'SELECT User_ID AS "User_ID" FROM users WHERE Email = ? AND User_ID <> ? LIMIT 1'
    );
    $emailCheck->execute([$email, (int) $user['id']]);

    if ($emailCheck->fetch()) {
        $db->rollBack();
        fail('That email address is already used by another account.', 409);
    }

    $updateUser = $db->prepare(
        'UPDATE users
         SET Full_Name = ?, Email = ?, Mobile_Number = ?
         WHERE User_ID = ? AND Role = ?'
    );
    $updateUser->execute([
        $fullName,
        $email,
        $phone,
        (int) $user['id'],
        'student',
    ]);

    $updateStudent = $db->prepare(
        'UPDATE students
         SET Program = ?, Year_Level = ?, Section = ?
         WHERE User_ID = ?'
    );
    $updateStudent->execute([
        $program,
        $yearLevel,
        $section,
        (int) $user['id'],
    ]);

    $db->commit();

    $statement = $db->prepare(
        'SELECT
            User_ID AS "User_ID",
            Username AS "Username",
            Full_Name AS "Full_Name",
            Email AS "Email",
            Mobile_Number AS "Mobile_Number",
            Profile_Photo AS "Profile_Photo",
            Role AS "Role"
         FROM users
         WHERE User_ID = ?
         LIMIT 1'
    );
    $statement->execute([(int) $user['id']]);
    $updatedUser = rememberUserSession(publicUser($statement->fetch()));

    reply([
        'ok' => true,
        'message' => 'Profile updated.',
        'user' => $updatedUser,
        'profile' => userProfile($db, (int) $user['id'], 'student'),
    ]);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log($exception->getMessage());
    fail('Unable to update the student profile.', 500);
}
