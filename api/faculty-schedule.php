<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$facultyId = (int) ($_GET['faculty_id'] ?? 0);
$date = clean((string) ($_GET['date'] ?? ''));

if ($facultyId <= 0) {
    fail('Please choose a faculty member.', 400);
}

try {
    $db = database();

    $faculty = $db->prepare(
        'SELECT Consultation_Hours AS "Consultation_Hours"
         FROM faculty
         WHERE Faculty_ID = ?
         LIMIT 1'
    );
    $faculty->execute([$facultyId]);
    $record = $faculty->fetch();

    if (!$record) {
        fail('Faculty member was not found.', 404);
    }

    $weeklyHours = parseWeeklyHours((string) ($record['Consultation_Hours'] ?? ''));
    $response = [
        'ok' => true,
        'days' => availableDayNumbers($weeklyHours),
        'day_names' => availableDayNames($weeklyHours),
    ];

    if ($date !== '') {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            fail('Please choose a valid date.', 400);
        }

        $dateTime = DateTimeImmutable::createFromFormat('Y-m-d', $date);
        if (!$dateTime) {
            fail('Please choose a valid date.', 400);
        }

        $dayNumber = (int) $dateTime->format('N');
        if ($dayNumber < 1 || $dayNumber > 6) {
            $response['slots'] = [];
            $response['message'] = 'Consultations are available from Monday to Saturday only.';
            reply($response);
        }

        $dayName = $dateTime->format('l');
        $availableStarts = $weeklyHours[$dayName] ?? [];
        $takenStarts = bookedStarts($db, $facultyId, $date);

        $response['slots'] = array_map(
            static fn (string $start): array => [
                'label' => slotLabel($start),
                'value' => slotLabel($start),
                'start' => $start,
                'taken' => in_array($start, $takenStarts, true),
            ],
            $availableStarts
        );
    }

    reply($response);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to load the faculty schedule.', 500);
}

function parseWeeklyHours(string $raw): array
{
    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    $weekly = array_fill_keys($days, []);

    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        foreach ($decoded as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $day = (string) ($entry['day'] ?? '');
            if (!array_key_exists($day, $weekly)) {
                continue;
            }
            $times = $entry['times'] ?? [];
            if (!is_array($times)) {
                $times = rangeToSlotLabels((string) ($entry['time'] ?? ''));
            }
            $weekly[$day] = slotStartsFromLabels($times);
        }
        return $weekly;
    }

    $rows = preg_split('/\r?\n|;/', $raw) ?: [];
    foreach ($rows as $row) {
        $row = trim($row);
        if ($row === '') {
            continue;
        }
        [$day, $time] = array_pad(preg_split('/:\s*/', $row, 2) ?: [], 2, '');
        if (array_key_exists($day, $weekly)) {
            $weekly[$day] = slotStartsFromLabels(rangeToSlotLabels($time));
        }
    }

    return $weekly;
}

function rangeToSlotLabels(string $range): array
{
    if (!preg_match('/(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:-|\x{2013})\s*(\d{1,2}):(\d{2})\s*(AM|PM)/iu', $range, $matches)) {
        return [];
    }

    $start = timeToMinutes($matches[1], $matches[2], $matches[3]);
    $end = timeToMinutes($matches[4], $matches[5], $matches[6]);
    $labels = [];

    for ($slot = $start; $slot + 30 <= $end; $slot += 30) {
        $labels[] = slotLabel(minutesToTime($slot));
    }

    return $labels;
}

function slotStartsFromLabels(array $labels): array
{
    $starts = [];
    foreach ($labels as $label) {
        $start = preferredTimeStart((string) $label);
        if ($start >= '08:00:00' && $start < '20:00:00' && !in_array($start, $starts, true)) {
            $starts[] = $start;
        }
    }
    sort($starts);
    return $starts;
}

function availableDayNumbers(array $weeklyHours): array
{
    $numbers = [];
    $index = 1;
    foreach ($weeklyHours as $starts) {
        if (!empty($starts)) {
            $numbers[] = $index;
        }
        $index++;
    }
    return $numbers;
}

function availableDayNames(array $weeklyHours): array
{
    return array_values(array_filter(
        array_keys($weeklyHours),
        static fn (string $day): bool => !empty($weeklyHours[$day])
    ));
}

function bookedStarts(PDO $db, int $facultyId, string $date): array
{
    $statement = $db->prepare(
        "SELECT Preferred_Time AS \"Preferred_Time\"
         FROM consultation_requests
         WHERE Faculty_ID = ?
           AND Request_Date = ?
           AND Status IN ('pending', 'approved', 'rescheduled')"
    );
    $statement->execute([$facultyId, $date]);
    return array_map(
        static fn (array $row): string => substr((string) $row['Preferred_Time'], 0, 8),
        $statement->fetchAll()
    );
}

function slotLabel(string $start): string
{
    $startMinutes = timeStringToMinutes($start);
    return formatClock($startMinutes) . ' - ' . formatClock($startMinutes + 30);
}

function timeToMinutes(string $hour, string $minute, string $period): int
{
    $hourValue = (int) $hour;
    if (strtoupper($period) === 'PM' && $hourValue < 12) {
        $hourValue += 12;
    }
    if (strtoupper($period) === 'AM' && $hourValue === 12) {
        $hourValue = 0;
    }
    return $hourValue * 60 + (int) $minute;
}

function timeStringToMinutes(string $time): int
{
    [$hour, $minute] = array_map('intval', explode(':', substr($time, 0, 5)));
    return $hour * 60 + $minute;
}

function minutesToTime(int $minutes): string
{
    return sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
}

function formatClock(int $minutes): string
{
    $hour24 = intdiv($minutes, 60) % 24;
    $minute = $minutes % 60;
    $period = $hour24 >= 12 ? 'PM' : 'AM';
    $hour12 = $hour24 % 12;
    if ($hour12 === 0) {
        $hour12 = 12;
    }
    return sprintf('%d:%02d %s', $hour12, $minute, $period);
}
