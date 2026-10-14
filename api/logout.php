<?php
declare(strict_types=1);

// SYSTEM NOTE: Clears the current login session.

require __DIR__ . '/bootstrap.php';
requirePost();

try {
    $sessionUser = !empty($_SESSION['user']) ? normalizeSessionUser($_SESSION['user']) : null;
    if ($sessionUser && $sessionUser['role'] === 'faculty' && $sessionUser['id'] > 0) {
        saveFacultyAvailabilityForUser(database(), $sessionUser['id'], 'offline');
    }
} catch (PDOException $exception) {
    error_log($exception->getMessage());
}

clearLoginSession();

reply(['ok' => true, 'message' => 'Logged out.']);
