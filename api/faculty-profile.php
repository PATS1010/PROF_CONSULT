<?php
declare(strict_types=1);

// SYSTEM NOTE: Updates the logged-in faculty profile details.

require __DIR__ . '/bootstrap.php';
requirePost();

$user = requireRole('faculty');
$data = input();

$fullName = clean((string) ($data['full_name'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? '')));
$phone = preg_replace('/\D/', '', (string) ($data['phone'] ?? ''));
$department = clean((string) ($data['department'] ?? ''));
$office = clean((string) ($data['office'] ?? ''));
$consultationHours = clean((string) ($data['consultation_hours'] ?? ''));

if ($fullName === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($phone) !== 10
    || $department === '') {
    fail('Please provide valid faculty profile details.');
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
        'faculty',
    ]);

    $updateFaculty = $db->prepare(
        'UPDATE faculty
         SET Department = ?, Office = ?, Consultation_Hours = ?
         WHERE User_ID = ?'
    );
    $updateFaculty->execute([
        $department,
        $office !== '' ? $office : null,
        $consultationHours !== '' ? $consultationHours : null,
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
        'profile' => userProfile($db, (int) $user['id'], 'faculty'),
    ]);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log($exception->getMessage());
    fail('Unable to update the faculty profile.', 500);
}
