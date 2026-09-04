<?php
declare(strict_types=1);

// SYSTEM NOTE: Lists consultation requests and lets faculty update request status.

require __DIR__ . '/bootstrap.php';

$requestBody = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read the JSON body once so the role and request update use the same submitted data.
    $requestBody = input();
}

// Prefer the role sent by the page so professor actions use the faculty session even if a student session also exists.
$requestedRole = clean((string) ($_GET['role'] ?? ($requestBody['role'] ?? '')));
// Load the role-specific user session when the page asks for student or faculty behavior.
$user = in_array($requestedRole, ['student', 'faculty'], true)
    ? currentUser($requestedRole)
    : currentUser();
$db = database();

try {
    // Make sure older databases have the message column before reading requests.
    ensureConsultationMessageColumn($db);

    // Get the student or faculty profile row connected to the logged-in user.
    $profile = userProfile($db, $user['id'], $user['role']);
    if (!$profile) {
        fail('Profile was not found.', 404);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Only faculty accounts can approve, decline, reschedule, complete, or cancel requests.
        if ($user['role'] !== 'faculty') {
            fail('Only faculty can update consultation requests.', 403);
        }

        // Use the already-read body instead of reading php://input a second time.
        $data = $requestBody;
        // Request_ID tells the API which consultation request should be updated.
        $requestId = (int) ($data['request_id'] ?? 0);
        // Status is cleaned so only expected text is saved.
        $status = clean((string) ($data['status'] ?? ''));
        // Optional faculty response is saved with the request when provided.
        $response = clean((string) ($data['response'] ?? ''));
        // These are the only request states the system currently supports.
        $allowedStatuses = ['pending', 'approved', 'declined', 'rescheduled', 'completed', 'cancelled'];

        // Reject missing request IDs or statuses outside the allowed list.
        if ($requestId <= 0 || !in_array($status, $allowedStatuses, true)) {
            fail('Please provide a valid request update.');
        }

        // Update only the selected request that belongs to the logged-in professor.
        $update = $db->prepare(
            'UPDATE consultation_requests
             SET Status = ?, Response = ?
             WHERE Request_ID = ? AND Faculty_ID = ?'
        );
        // Save null when the professor did not type a response.
        $update->execute([$status, $response !== '' ? $response : null, $requestId, (int) $profile['profile_id']]);

        // If no row changed, the request either does not exist or belongs to another faculty account.
        if ($update->rowCount() === 0) {
            fail('Consultation request was not found.', 404);
        }

        // Find the student user so the system can notify them about the decision.
        $student = $db->prepare(
            'SELECT u.User_ID
             FROM consultation_requests cr
             INNER JOIN students s ON s.Student_ID = cr.Student_ID
             INNER JOIN users u ON u.User_ID = s.User_ID
             WHERE cr.Request_ID = ?
             LIMIT 1'
        );
        $student->execute([$requestId]);
        // fetch() returns the user row for the student who submitted this request.
        $studentRecord = $student->fetch();

        if ($studentRecord) {
            // Build the message that appears in the student's notifications page/dashboard.
            $message = 'Your consultation request was ' . $status . '.';
            $notification = $db->prepare(
                'INSERT INTO notifications (User_ID, Message, Read_Status)
                 VALUES (?, ?, ?)'
            );
            // Save the notification as unread so the student can see the new update.
            $notification->execute([(int) $studentRecord['User_ID'], $message, 'unread']);
        }

        reply(['ok' => true]);
    }

    if ($user['role'] === 'student') {
        $statement = $db->prepare(
            'SELECT
                cr.Request_ID,
                cr.Purpose,
                cr.Additional_Message,
                cr.Request_Date,
                cr.Preferred_Time,
                cr.Status,
                cr.Response,
                f.Faculty_ID,
                faculty_user.Full_Name AS Faculty_Name,
                f.Department
             FROM consultation_requests cr
             INNER JOIN faculty f ON f.Faculty_ID = cr.Faculty_ID
             INNER JOIN users faculty_user ON faculty_user.User_ID = f.User_ID
             WHERE cr.Student_ID = ?
             ORDER BY cr.Request_Date DESC, cr.Preferred_Time DESC'
        );
    } else {
        $statement = $db->prepare(
            'SELECT
                cr.Request_ID,
                cr.Purpose,
                cr.Additional_Message,
                cr.Request_Date,
                cr.Preferred_Time,
                cr.Status,
                cr.Response,
                s.Student_ID,
                student_user.Username AS Student_Number,
                student_user.Full_Name AS Student_Name,
                s.Program,
                s.Year_Level,
                s.Section
             FROM consultation_requests cr
             INNER JOIN students s ON s.Student_ID = cr.Student_ID
             INNER JOIN users student_user ON student_user.User_ID = s.User_ID
             WHERE cr.Faculty_ID = ?
             ORDER BY cr.Request_Date DESC, cr.Preferred_Time DESC'
        );
    }

    $statement->execute([(int) $profile['profile_id']]);
    reply(['ok' => true, 'requests' => $statement->fetchAll()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load consultation requests.', 500);
}
