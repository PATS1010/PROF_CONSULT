<?php
declare(strict_types=1);

// Presence expires even if the browser crashes and cannot send its leave request.
const FACULTY_PRESENCE_TTL = 90;

function touchFacultyPresence(PDO $db, int $facultyId, string $pageId, ?bool $checkedIn = null, ?DateTimeImmutable $now = null): void
{
    $timestamp = ($now ?? currentManilaDateTime())->format('Y-m-d H:i:s');
    $fields = 'Last_Seen = EXCLUDED.Last_Seen, Page_ID = EXCLUDED.Page_ID';
    if ($checkedIn !== null) $fields .= ', Checked_In = EXCLUDED.Checked_In';
    $statement = $db->prepare(
        'INSERT INTO faculty_presence (Faculty_ID, Last_Seen, Page_ID, Checked_In) VALUES (?, ?, ?, ?)
         ON CONFLICT (Faculty_ID) DO UPDATE SET ' . $fields
    );
    $statement->bindValue(1, $facultyId, PDO::PARAM_INT);
    $statement->bindValue(2, $timestamp);
    $statement->bindValue(3, $pageId);
    $statement->bindValue(4, $checkedIn ?? false, PDO::PARAM_BOOL);
    $statement->execute();
}

function resetFacultyPresence(PDO $db, int $facultyId): void
{
    $statement = $db->prepare('UPDATE faculty_presence SET Checked_In = FALSE, Last_Seen = NULL, Page_ID = NULL WHERE Faculty_ID = ?');
    $statement->execute([$facultyId]);
}

function facultyCheckedIn(PDO $db, int $facultyId): bool
{
    $statement = $db->prepare('SELECT Checked_In FROM faculty_presence WHERE Faculty_ID = ?');
    $statement->execute([$facultyId]);
    return in_array($statement->fetchColumn(), [true, 1, '1', 't', 'true'], true);
}

function facultyCurrentStatus(PDO $db, int $facultyId, ?DateTimeImmutable $now = null): string
{
    return facultyCurrentStatuses($db, [$facultyId], $now)[$facultyId];
}

function facultyCurrentStatuses(PDO $db, array $facultyIds, ?DateTimeImmutable $now = null): array
{
    if (!$facultyIds) return [];
    $statuses = array_fill_keys($facultyIds, 'offline');
    $now = $now ?? currentManilaDateTime();
    $placeholders = implode(', ', array_fill(0, count($facultyIds), '?'));
    // Resolve the whole directory in two queries rather than per-faculty queries.
    $presence = $db->prepare(
        'SELECT p.Faculty_ID AS "Faculty_ID", p.Checked_In AS "Checked_In", p.Last_Seen AS "Last_Seen", a.Status AS "Status"
         FROM faculty_presence p
         LEFT JOIN availability a ON a.Availability_ID = (
             SELECT latest.Availability_ID FROM availability latest
             WHERE latest.Faculty_ID = p.Faculty_ID ORDER BY latest.Availability_ID DESC LIMIT 1
         ) WHERE p.Faculty_ID IN (' . $placeholders . ')'
    );
    $presence->execute($facultyIds);
    foreach ($presence->fetchAll() as $record) {
        if (!in_array($record['Checked_In'], [true, 1, '1', 't', 'true'], true) || empty($record['Last_Seen'])) continue;
        $lastSeen = new DateTimeImmutable($record['Last_Seen'], new DateTimeZone('Asia/Manila'));
        if ($lastSeen >= $now->modify('-' . FACULTY_PRESENCE_TTL . ' seconds')) {
            $statuses[(int) $record['Faculty_ID']] = (string) ($record['Status'] ?: 'offline');
        }
    }
    // Actual accepted bookings, not merely the professor's available hours.
    $appointments = $db->prepare(
        'SELECT Faculty_ID AS "Faculty_ID", Preferred_Time AS "Preferred_Time" FROM consultation_requests
         WHERE Faculty_ID IN (' . $placeholders . ") AND Request_Date = ? AND Status IN ('approved', 'rescheduled')"
    );
    $appointments->execute(array_merge($facultyIds, [$now->format('Y-m-d')]));
    foreach ($appointments->fetchAll() as $appointment) {
        $start = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $now->format('Y-m-d') . ' ' . substr((string) $appointment['Preferred_Time'], 0, 8), new DateTimeZone('Asia/Manila'));
        if ($start && $now >= $start && $now < $start->modify('+30 minutes')) {
            $statuses[(int) $appointment['Faculty_ID']] = 'consultation';
        }
    }
    return $statuses;
}
