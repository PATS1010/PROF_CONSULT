<?php
declare(strict_types=1);

require dirname(__DIR__) . '/api/faculty-status.php';
function currentManilaDateTime(): DateTimeImmutable { return new DateTimeImmutable('now', new DateTimeZone('Asia/Manila')); }
function at(string $time): DateTimeImmutable { return new DateTimeImmutable('2030-01-07 ' . $time, new DateTimeZone('Asia/Manila')); }
function expectStatus(PDO $db, string $time, string $expected, string $label): void {
    if (facultyCurrentStatus($db, 1, at($time)) !== $expected) throw new RuntimeException($label);
    echo 'PASS ' . $label . "\n";
}
$db = new PDO('sqlite::memory:', null, null, [PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$db->exec('CREATE TABLE availability (Availability_ID INTEGER PRIMARY KEY, Faculty_ID INTEGER, Status TEXT)');
$db->exec('CREATE TABLE faculty_presence (Faculty_ID INTEGER PRIMARY KEY, Checked_In BOOLEAN DEFAULT FALSE, Last_Seen TEXT, Page_ID TEXT)');
$db->exec('CREATE TABLE consultation_requests (Faculty_ID INTEGER, Request_Date TEXT, Preferred_Time TEXT, Status TEXT)');
$db->exec("INSERT INTO availability (Faculty_ID,Status) VALUES (1,'available')");
$db->exec("INSERT INTO consultation_requests VALUES (1,'2030-01-07','09:00:00','approved'),(1,'2030-01-07','10:00:00','rescheduled'),(1,'2030-01-07','11:00:00','pending'),(1,'2030-01-07','12:00:00','declined')");
expectStatus($db, '08:59:59', 'offline', 'Faculty starts offline without check-in');
touchFacultyPresence($db, 1, 'page-a', null, at('08:59:59'));
expectStatus($db, '08:59:59', 'offline', 'Opening the site does not automatically check in');
expectStatus($db, '09:00:00', 'consultation', 'Approved consultation starts exactly at its scheduled time while offline');
expectStatus($db, '09:29:59', 'consultation', 'Consultation remains active until the end of its slot');
expectStatus($db, '09:30:00', 'offline', 'Consultation ends exactly at 30 minutes when not checked in');
expectStatus($db, '10:00:00', 'consultation', 'Rescheduled consultation activates without an open browser');
expectStatus($db, '10:30:00', 'offline', 'Rescheduled consultation returns offline when its slot ends');
expectStatus($db, '11:00:00', 'offline', 'Pending requests do not activate consultation status');
expectStatus($db, '12:00:00', 'offline', 'Declined requests do not activate consultation status');
touchFacultyPresence($db, 1, 'page-a', true, at('08:55:00'));
expectStatus($db, '08:55:01', 'available', 'Manual check-in makes an active professor online');
expectStatus($db, '08:56:31', 'offline', 'Missing heartbeat expires online presence after 90 seconds');
touchFacultyPresence($db, 1, 'page-a', null, at('09:29:59'));
expectStatus($db, '09:29:59', 'consultation', 'Scheduled consultation overrides an active online status');
expectStatus($db, '09:30:00', 'available', 'An actively checked-in professor returns online after consultation');
resetFacultyPresence($db, 1);
expectStatus($db, '09:15:00', 'consultation', 'Logging out does not cancel the scheduled consultation window');
expectStatus($db, '09:30:00', 'offline', 'A logged-out professor is offline when consultation ends');
touchFacultyPresence($db, 1, 'new-page', true, at('11:30:00'));
$leave = $db->prepare('UPDATE faculty_presence SET Last_Seen = NULL WHERE Faculty_ID = ? AND Page_ID = ?');
$leave->execute([1, 'old-page']);
expectStatus($db, '11:30:01', 'available', 'A delayed leave from an old page cannot clear the new page presence');
$leave->execute([1, 'new-page']);
expectStatus($db, '11:30:01', 'offline', 'Leaving the current page clears online presence');
echo "Completed 17 deterministic presence and schedule checks.\n";
