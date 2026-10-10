<?php
declare(strict_types=1);

// SYSTEM NOTE: Permanently deletes the logged-in student or faculty account.

require __DIR__ . '/bootstrap.php';
requirePost();

$data = input();
$role = clean((string) ($data['role'] ?? ''));
$password = (string) ($data['password'] ?? '');

if (!in_array($role, ['student', 'faculty'], true) || $password === '') {
    fail('Please enter your password to delete your account.');
}

try {
    $user = requireRole($role);
    $db = database();

    $statement = $db->prepare(
        'SELECT
            User_ID AS "User_ID",
            Password AS "Password",
            Profile_Photo AS "Profile_Photo",
            Role AS "Role",
            Account_Status AS "Account_Status"
         FROM users
         WHERE User_ID = ? AND Role = ?
         LIMIT 1'
    );
    $statement->execute([$user['id'], $role]);
    $record = $statement->fetch();

    if (!$record || $record['Account_Status'] !== 'active') {
        fail('Please log in again before deleting your account.', 401);
    }

    if (!password_verify($password, $record['Password'])) {
        fail('Incorrect password.', 401);
    }

    $profile = userProfile($db, (int) $record['User_ID'], $role);
    $profileId = $profile ? (int) $profile['profile_id'] : 0;

    $db->beginTransaction();

    if ($role === 'student' && $profileId > 0) {
        $deleteRequests = $db->prepare('DELETE FROM consultation_requests WHERE Student_ID = ?');
        $deleteRequests->execute([$profileId]);

        $deleteProfile = $db->prepare('DELETE FROM students WHERE Student_ID = ?');
        $deleteProfile->execute([$profileId]);
    }

    if ($role === 'faculty' && $profileId > 0) {
        $deleteRequests = $db->prepare('DELETE FROM consultation_requests WHERE Faculty_ID = ?');
        $deleteRequests->execute([$profileId]);

        $deleteAvailability = $db->prepare('DELETE FROM availability WHERE Faculty_ID = ?');
        $deleteAvailability->execute([$profileId]);

        $deleteAttendance = $db->prepare('DELETE FROM attendance_logs WHERE Faculty_ID = ?');
        $deleteAttendance->execute([$profileId]);

        $deleteProfile = $db->prepare('DELETE FROM faculty WHERE Faculty_ID = ?');
        $deleteProfile->execute([$profileId]);
    }

    $deleteNotifications = $db->prepare('DELETE FROM notifications WHERE User_ID = ?');
    $deleteNotifications->execute([(int) $record['User_ID']]);

    $deleteResetCodes = $db->prepare('DELETE FROM password_reset_codes WHERE User_ID = ?');
    $deleteResetCodes->execute([(int) $record['User_ID']]);

    $deleteUser = $db->prepare('DELETE FROM users WHERE User_ID = ? AND Role = ?');
    $deleteUser->execute([(int) $record['User_ID'], $role]);

    if ($deleteUser->rowCount() !== 1) {
        $db->rollBack();
        fail('Unable to delete this account.', 500);
    }

    $db->commit();

    $profilePhoto = (string) ($record['Profile_Photo'] ?? '');
    if ($profilePhoto !== '' && !preg_match('/^https?:\/\//i', $profilePhoto)) {
        $photoPath = realpath(__DIR__ . '/../' . ltrim($profilePhoto, '/\\'));
        $uploadsPath = realpath(__DIR__ . '/../uploads/profile-photos');
        if ($photoPath && $uploadsPath && str_starts_with($photoPath, $uploadsPath) && is_file($photoPath)) {
            @unlink($photoPath);
        }
    }

    clearLoginSession();
    reply(['ok' => true, 'message' => 'Account deleted.']);
} catch (PDOException $exception) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('Unable to delete account right now.', 500);
}
