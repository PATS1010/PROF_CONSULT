<?php
declare(strict_types=1);

// SYSTEM NOTE: Authenticates users and stores the correct role session.

require __DIR__ . '/bootstrap.php';
requirePost();

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$identifier = strtolower(clean((string) ($data['identifier'] ?? '')));
$password = (string) ($data['password'] ?? '');

if (($role !== '' && !in_array($role, ['student', 'faculty'], true))
    || $identifier === ''
    || $password === '') {
    fail('Please enter your account details.');
}

try {
    $db = database();
    $roleFilter = $role !== '' ? 'Role = ?' : "Role IN ('student', 'faculty')";
    $parameters = $role !== ''
        ? [$role, $identifier, $identifier]
        : [$identifier, $identifier];

    $statement = $db->prepare(
        "SELECT
            User_ID AS \"User_ID\",
            Username AS \"Username\",
            Password AS \"Password\",
            Full_Name AS \"Full_Name\",
            Email AS \"Email\",
            Mobile_Number AS \"Mobile_Number\",
            Role AS \"Role\",
            Account_Status AS \"Account_Status\"
         FROM users
         WHERE {$roleFilter} AND (LOWER(Email) = ? OR LOWER(Username) = ?)
         LIMIT 1"
    );
    $statement->execute($parameters);
    $record = $statement->fetch();

    if (!$record
        || $record['Account_Status'] !== 'active'
        || !password_verify($password, $record['Password'])) {
        fail('Incorrect email/ID number or password.', 401);
    }

    session_regenerate_id(true);
    $_SESSION['user'] = rememberUserSession(publicUser($record));
    if ($_SESSION['user']['role'] === 'faculty') {
        try {
            saveFacultyAvailabilityForUser(
                $db,
                (int) $record['User_ID'],
                'offline'
            );
        } catch (PDOException $exception) {
            error_log('Faculty login availability update failed: ' . $exception->getMessage());
        }
    }
    reply(['ok' => true, 'user' => $_SESSION['user'], 'tab_token' => issueTabToken($_SESSION['user'])]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('A database error occurred. Check config.php and import database/schema.sql.', 500);
}
