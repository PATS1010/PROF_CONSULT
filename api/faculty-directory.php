<?php
declare(strict_types=1);

// SYSTEM NOTE: Returns faculty profile, photo, department, and availability data for student search.

require __DIR__ . '/bootstrap.php';

try {
    $db = database();
    ensureProfilePhotoColumn($db);

    $statement = $db->query(
        'SELECT
            f.Faculty_ID AS "Faculty_ID",
            f.Department AS "Department",
            f.Office AS "Office",
            f.Consultation_Hours AS "Consultation_Hours",
            u.Full_Name AS "Full_Name",
            u.Email AS "Email",
            u.Mobile_Number AS "Mobile_Number",
            u.Profile_Photo AS "Profile_Photo",
            (
                SELECT a.Status
                FROM availability a
                WHERE a.Faculty_ID = f.Faculty_ID AND a.Date = CURRENT_DATE
                ORDER BY a.Time DESC
                LIMIT 1
            ) AS "Current_Status"
         FROM faculty f
         INNER JOIN users u ON u.User_ID = f.User_ID
         WHERE u.Role = \'faculty\' AND u.Account_Status = \'active\'
         ORDER BY u.Full_Name'
    );

    reply(['ok' => true, 'faculty' => $statement->fetchAll()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load faculty directory.', 500);
}
