<?php
declare(strict_types=1);

// SYSTEM NOTE: Returns faculty profile, photo, department, and availability data for student search.

require __DIR__ . '/bootstrap.php';
currentUser();

try {
    // Open the shared PostgreSQL connection from api/config.php.
    $db = database();
    // Make sure older databases still have the optional profile photo column.
    ensureProfilePhotoColumn($db);

    // Build one directory query that returns each active faculty account and its latest saved status.
    $statement = $db->query(
        'SELECT
            -- Keep the original PHP/frontend key names by aliasing PostgreSQL columns with quoted names.
            f.Faculty_ID AS "Faculty_ID",
            f.Department AS "Department",
            f.Office AS "Office",
            f.Consultation_Hours AS "Consultation_Hours",
            u.Full_Name AS "Full_Name",
            u.Email AS "Email",
            u.Mobile_Number AS "Mobile_Number",
            u.Profile_Photo AS "Profile_Photo"
         -- Start from faculty profiles.
         FROM faculty f
         -- Join user account data so the frontend can show names, emails, and photos.
         INNER JOIN users u ON u.User_ID = f.User_ID
         -- Return only active faculty users.
         WHERE u.Role = \'faculty\' AND u.Account_Status = \'active\'
         -- Sort faculty alphabetically by full name.
         ORDER BY u.Full_Name'
    );

    // Send the faculty list back to the browser as JSON.
    $faculty = $statement->fetchAll();
    $statuses = facultyCurrentStatuses($db, array_map(static fn (array $record): int => (int) $record['Faculty_ID'], $faculty));
    foreach ($faculty as &$record) {
        $record['Current_Status'] = $statuses[(int) $record['Faculty_ID']];
    }
    unset($record);
    reply(['ok' => true, 'faculty' => $faculty]);
} catch (PDOException $exception) {
    // Store the database error in server logs without exposing it to students.
    error_log($exception->getMessage());
    // Return a safe JSON error response to the browser.
    fail('Unable to load faculty directory.', 500);
}
