<?php
declare(strict_types=1);

// SYSTEM NOTE: Loads shared API helpers for sessions, database access, validation, and JSON responses.

// Shared backend setup for PHP form handlers.
// Starts the user session, loads the database connection, and provides validation/JSON helper functions.

session_start();
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

function reply(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

function fail(string $message, int $status = 422): never
{
    reply(['ok' => false, 'message' => $message], $status);
}

function requirePost(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Only POST requests are allowed.', 405);
    }
}

function clean(string $value): string
{
    return trim($value);
}

function validPassword(string $password): bool
{
    return strlen($password) >= 8 && preg_match('/[A-Z]/', $password) && preg_match('/\d/', $password);
}

function publicUser(array $row): array
{
    return [
        'id' => (int) ($row['User_ID'] ?? $row['id']),
        'role' => $row['Role'] ?? $row['role'],
        'name' => $row['Full_Name'] ?? $row['full_name'] ?? '',
        'username' => $row['Username'] ?? $row['username'] ?? '',
        'email' => $row['Email'] ?? $row['email'] ?? '',
        'phone' => $row['Mobile_Number'] ?? $row['mobile_number'] ?? '',
        'profile_photo' => $row['Profile_Photo'] ?? $row['profile_photo'] ?? '',
    ];
}

function ensureProfilePhotoColumn(PDO $db): void
{
    $statement = $db->query("SHOW COLUMNS FROM users LIKE 'Profile_Photo'");
    if (!$statement->fetch()) {
        $db->exec('ALTER TABLE users ADD Profile_Photo VARCHAR(255) NULL AFTER Mobile_Number');
    }
}

function ensureConsultationMessageColumn(PDO $db): void
{
    $statement = $db->query("SHOW COLUMNS FROM consultation_requests LIKE 'Additional_Message'");
    if (!$statement->fetch()) {
        $db->exec('ALTER TABLE consultation_requests ADD Additional_Message TEXT NULL AFTER Purpose');
    }
}

function normalizeSessionUser(array $user): array
{
    return [
        'id' => (int) ($user['id'] ?? $user['User_ID'] ?? 0),
        'role' => $user['role'] ?? $user['Role'] ?? '',
        'name' => $user['name'] ?? $user['Full_Name'] ?? '',
        'username' => $user['username'] ?? $user['Username'] ?? '',
        'email' => $user['email'] ?? $user['Email'] ?? '',
        'phone' => $user['phone'] ?? $user['Mobile_Number'] ?? '',
        'profile_photo' => $user['profile_photo'] ?? $user['Profile_Photo'] ?? '',
    ];
}

function rememberUserSession(array $user): array
{
    $normalized = normalizeSessionUser($user);
    if ($normalized['id'] <= 0 || $normalized['role'] === '') {
        fail('Please log in first.', 401);
    }

    $_SESSION['user'] = $normalized;
    $_SESSION[$normalized['role'] . '_user'] = $normalized;
    return $normalized;
}

function currentUser(?string $role = null): array
{
    if ($role && !empty($_SESSION['user'])) {
        $activeUser = normalizeSessionUser($_SESSION['user']);
        if ($activeUser['role'] === $role) {
            $_SESSION[$role . '_user'] = $activeUser;
            return $activeUser;
        }
    }

    $sessionKey = $role ? $role . '_user' : 'user';
    if (empty($_SESSION[$sessionKey]) && $role && !empty($_SESSION['user'])) {
        $fallback = normalizeSessionUser($_SESSION['user']);
        if ($fallback['role'] === $role) {
            $_SESSION[$sessionKey] = $fallback;
        }
    }

    if (empty($_SESSION[$sessionKey])) {
        fail('Please log in first.', 401);
    }

    $normalized = normalizeSessionUser($_SESSION[$sessionKey]);
    if ($normalized['id'] <= 0 || $normalized['role'] === '') {
        fail('Please log in first.', 401);
    }
    if ($role && $normalized['role'] !== $role) {
        fail('You are not allowed to perform this action.', 403);
    }

    $_SESSION[$sessionKey] = $normalized;
    if (!$role) {
        $_SESSION['user'] = $normalized;
    }
    return $normalized;
}

function requireRole(string $role): array
{
    return currentUser($role);
}

function userProfile(PDO $db, int $userId, string $role): ?array
{
    if ($role === 'student') {
        $statement = $db->prepare(
            'SELECT Student_ID AS profile_id, Program, Year_Level, Section
             FROM students WHERE User_ID = ? LIMIT 1'
        );
    } elseif ($role === 'faculty') {
        $statement = $db->prepare(
            'SELECT Faculty_ID AS profile_id, Department, Office, Consultation_Hours
             FROM faculty WHERE User_ID = ? LIMIT 1'
        );
    } else {
        return null;
    }

    $statement->execute([$userId]);
    $profile = $statement->fetch();
    return $profile ?: null;
}

function preferredTimeStart(string $value): string
{
    if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $value)) {
        return strlen($value) === 5 ? $value . ':00' : $value;
    }

    if (!preg_match('/(\d{1,2}):(\d{2})\s*(AM|PM)/i', $value, $matches)) {
        fail('Please provide a valid preferred time.');
    }

    $hour = (int) $matches[1];
    $minute = (int) $matches[2];
    $period = strtoupper($matches[3]);

    if ($period === 'PM' && $hour < 12) {
        $hour += 12;
    }
    if ($period === 'AM' && $hour === 12) {
        $hour = 0;
    }

    return sprintf('%02d:%02d:00', $hour, $minute);
}
