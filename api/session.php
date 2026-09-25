<?php
declare(strict_types=1);

// SYSTEM NOTE: Returns the active logged-in user for role-aware pages.

require __DIR__ . '/bootstrap.php';

$requestedRole = clean((string) ($_GET['role'] ?? ''));
$sessionUser = in_array($requestedRole, ['student', 'faculty'], true)
    ? currentUser($requestedRole)
    : currentUser();

try {
    $db = database();
    ensureProfilePhotoColumn($db);
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
         WHERE User_ID = ? AND Account_Status = ?
         LIMIT 1'
    );
    $statement->execute([$sessionUser['id'], 'active']);
    $record = $statement->fetch();

    if (!$record) {
        fail('Please log in first.', 401);
    }

    $user = rememberUserSession(publicUser($record));
    $profile = userProfile($db, $user['id'], $user['role']);
    reply(['ok' => true, 'user' => $user, 'profile' => $profile]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load the current session.', 500);
}
