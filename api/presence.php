<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
requirePost();
$user = requireRole('faculty');
releaseSessionLock();
$data = input();
$pageId = clean((string) ($data['page_id'] ?? ''));
$action = clean((string) ($data['action'] ?? 'heartbeat'));
if (!preg_match('/^[a-zA-Z0-9-]{1,64}$/', $pageId) || !in_array($action, ['heartbeat', 'leave'], true)) {
    fail('Please provide valid presence details.');
}
try {
    $db = database();
    $profile = userProfile($db, $user['id'], 'faculty');
    if (!$profile) fail('Faculty profile was not found.', 404);
    $facultyId = (int) $profile['profile_id'];
    if ($action === 'leave') {
        // A late leave request from an old page cannot clear the new page's lease.
        $leave = $db->prepare('UPDATE faculty_presence SET Last_Seen = NULL WHERE Faculty_ID = ? AND Page_ID = ?');
        $leave->execute([$facultyId, $pageId]);
    } else {
        touchFacultyPresence($db, $facultyId, $pageId);
    }
    reply(['ok' => true, 'status' => facultyCurrentStatus($db, $facultyId), 'checked_in' => facultyCheckedIn($db, $facultyId)]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to update faculty presence.', 500);
}
