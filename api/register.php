<?php
declare(strict_types=1);

// SYSTEM NOTE: Creates student or faculty accounts and profile records.

require __DIR__ . '/bootstrap.php';
requirePost();

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$username = clean((string) ($data['id_number'] ?? $data['username'] ?? ''));
$name = clean((string) ($data['full_name'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? '')));
$phone = preg_replace('/\D/', '', (string) ($data['phone'] ?? ''));
$password = (string) ($data['password'] ?? '');

if (!in_array($role, ['student', 'faculty'], true)
    || $username === ''
    || $name === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($phone) !== 10
    || !validPassword($password)) {
    fail('Please provide valid registration details.');
}

try {
    $db = database();
    $db->beginTransaction();

    $check = $db->prepare('SELECT User_ID FROM users WHERE Username = ? OR Email = ? LIMIT 1');
    $check->execute([$username, $email]);
    if ($check->fetch()) {
        $db->rollBack();
        fail('An account with that username or email already exists.', 409);
    }

    $insertUser = $db->prepare(
        'INSERT INTO users (Username, Password, Full_Name, Email, Mobile_Number, Role, Account_Status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $insertUser->execute([
        $username,
        password_hash($password, PASSWORD_DEFAULT),
        $name,
        $email,
        $phone,
        $role,
        'active',
    ]);
    $userId = (int) $db->lastInsertId();

    if ($role === 'student') {
        $program = clean((string) ($data['program'] ?? ''));
        $yearLevel = clean((string) ($data['year_level'] ?? ''));
        $section = clean((string) ($data['section'] ?? ''));

        if ($program === '' || $yearLevel === '') {
            $db->rollBack();
            fail('Please provide valid student details.');
        }

        $insertProfile = $db->prepare(
            'INSERT INTO students (User_ID, Program, Year_Level, Section)
             VALUES (?, ?, ?, ?)'
        );
        $insertProfile->execute([$userId, $program, $yearLevel, $section !== '' ? $section : 'N/A']);
    } else {
        $department = clean((string) ($data['department'] ?? ''));
        $office = clean((string) ($data['office'] ?? ''));
        $consultationHours = clean((string) ($data['consultation_hours'] ?? ''));

        if ($department === '') {
            $db->rollBack();
            fail('Please provide a faculty department.');
        }

        $insertProfile = $db->prepare(
            'INSERT INTO faculty (User_ID, Department, Office, Consultation_Hours)
             VALUES (?, ?, ?, ?)'
        );
        $insertProfile->execute([
            $userId,
            $department,
            $office !== '' ? $office : null,
            $consultationHours !== '' ? $consultationHours : null,
        ]);
    }

    $db->commit();

    $_SESSION['user'] = rememberUserSession(publicUser([
        'User_ID' => $userId,
        'Role' => $role,
        'Full_Name' => $name,
        'Username' => $username,
        'Email' => $email,
        'Mobile_Number' => $phone,
    ]));

    reply(['ok' => true, 'message' => 'Account created.', 'user' => $_SESSION['user']], 201);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('A database error occurred. Check config.php and import database/schema.sql.', 500);
}
