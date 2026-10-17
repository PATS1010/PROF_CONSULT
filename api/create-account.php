<?php
declare(strict_types=1);

// SYSTEM NOTE: Creates student or faculty accounts and profile records.

require __DIR__ . '/api-helpers.php';
requirePost();

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$username = clean((string) ($data['id_number'] ?? $data['username'] ?? ''));
$name = clean((string) ($data['full_name'] ?? ''));
$email = strtolower(clean((string) ($data['email'] ?? '')));
$phone = preg_replace('/\D/', '', (string) ($data['phone'] ?? ''));
$password = (string) ($data['password'] ?? '');
$verificationToken = clean((string) ($data['account_verification_token'] ?? ''));

if (!in_array($role, ['student', 'faculty'], true)
    || $username === ''
    || $name === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($phone) !== 10
    || !validPassword($password)
    || $verificationToken === '') {
    fail('Please provide valid registration details.');
}

try {
    $db = database();
    $db->beginTransaction();

    $checkUsername = $db->prepare('SELECT 1 FROM users WHERE Username = ? LIMIT 1');
    $checkUsername->execute([$username]);
    if ($checkUsername->fetchColumn()) {
        $db->rollBack();
        $idLabel = $role === 'faculty' ? 'faculty ID' : 'student ID';
        fail('This ' . $idLabel . ' already has an account.', 409);
    }

    $checkEmail = $db->prepare('SELECT 1 FROM users WHERE LOWER(Email) = ? LIMIT 1');
    $checkEmail->execute([$email]);
    if ($checkEmail->fetchColumn()) {
        $db->rollBack();
        fail('An account with that email already exists.', 409);
    }

    $verification = $db->prepare(
        'SELECT Verification_ID AS "Verification_ID"
         FROM account_verification_codes
         WHERE Token = ?
           AND Email = ?
           AND Role = ?
           AND Verified_At IS NOT NULL
           AND Consumed_At IS NULL
           AND Expires_At > CURRENT_TIMESTAMP
         LIMIT 1'
    );
    $verification->execute([$verificationToken, $email, $role]);
    $verificationId = $verification->fetchColumn();

    if (!$verificationId) {
        $db->rollBack();
        fail('Please verify your email before creating your account.', 403);
    }

    $insertUser = $db->prepare(
        'INSERT INTO users (Username, Password, Full_Name, Email, Mobile_Number, Role, Account_Status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING User_ID AS "User_ID"'
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
    $userId = (int) $insertUser->fetchColumn();

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

    $consumeVerification = $db->prepare(
        'UPDATE account_verification_codes
         SET Consumed_At = NOW()
         WHERE Verification_ID = ?'
    );
    $consumeVerification->execute([(int) $verificationId]);

    $db->commit();

    $_SESSION['user'] = rememberUserSession(publicUser([
        'User_ID' => $userId,
        'Role' => $role,
        'Full_Name' => $name,
        'Username' => $username,
        'Email' => $email,
        'Mobile_Number' => $phone,
    ]));

    reply(['ok' => true, 'message' => 'Account created.', 'user' => $_SESSION['user'], 'tab_token' => issueTabToken($_SESSION['user'])], 201);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('A database error occurred. Check app-config.php and import database/schema.sql.', 500);
}
