<?php
declare(strict_types=1);

// Only activated by the explicit local regression-test server command.
if (PHP_SAPI !== 'cli-server' || getenv('PROFCONSULT_TEST_MODE') !== '1') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
register_shutdown_function(static function () use ($path): void {
    if (str_starts_with($path, '/api/') || str_ends_with($path, '.html')) {
        error_log('TEST ' . $_SERVER['REQUEST_METHOD'] . ' ' . $path . ' -> ' . http_response_code());
    }
});
if (str_starts_with($path, '/_test/login/')) {
    $entry = basename($path);
    if (!in_array($entry, ['login.html', 'student-login.html', 'faculty-login.html'], true)) { http_response_code(404); exit; }
    $html = file_get_contents($root . '/' . $entry);
    $html = preg_replace('~<link[^>]+href="https://[^>]+>~', '', $html);
    $html = str_replace('<head>', '<head><base href="/"><script src="tests/auth-flow.js"></script>', $html);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}
if (in_array($path, ['/student-dashboard.html', '/faculty-dashboard.html'], true)) {
    $html = file_get_contents($root . $path);
    $html = preg_replace('~<link[^>]+href="https://[^>]+>~', '', $html);
    $html = str_replace('<head>', '<head><script src="tests/auth-flow.js"></script>', $html);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}
if (str_starts_with($path, '/_test/ui/')) {
    $case = basename($path);
    $pages = ['faculty' => 'faculty-profile.html', 'student' => 'student-profile.html', 'request' => 'request-consultation.html', 'availability' => 'faculty-availability.html', 'reschedule' => 'reschedule-consultation.html', 'fresh-tab' => 'faculty-profile.html', 'wrong-role' => 'faculty-profile.html'];
    if (!isset($pages[$case])) { http_response_code(404); exit; }
    $html = file_get_contents($root . '/' . $pages[$case]);
    $html = str_replace('<head>', '<head><base href="/"><script>window.TEST_CASE = ' . json_encode($case) . ';</script><script src="tests/browser-regressions.js"></script>', $html);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

if (!str_starts_with($path, '/api/') && !str_starts_with($path, '/_test/')) {
    return false;
}

date_default_timezone_set('Asia/Manila');
ini_set('session.save_path', __DIR__ . '/runtime');
session_start();
header('Content-Type: application/json');
set_exception_handler(static function (Throwable $e): void {
    error_log((string) $e);
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
});

// Execute the production endpoint bodies and helpers against an isolated SQLite
// fixture. Translate only PostgreSQL syntax; production connections are never used.
class FixturePDO extends PDO
{
    private function translate(string $sql): string
    {
        $sql = str_replace(['SERIAL PRIMARY KEY', 'NOW()', "CURRENT_TIMESTAMP + INTERVAL '2 hours'"], ['INTEGER PRIMARY KEY', 'CURRENT_TIMESTAMP', "datetime(CURRENT_TIMESTAMP, '+2 hours')"], $sql);
        $sql = preg_replace("/\((cr\.)?Request_Date::timestamp \+ (cr\.)?Preferred_Time \+ INTERVAL '30 minutes'\)/", "datetime($1Request_Date || ' ' || $2Preferred_Time, '+30 minutes')", $sql);
        $sql = str_replace('?::timestamp', '?', $sql);
        $sql = str_replace("EXTRACT(EPOCH FROM (Date_Time AT TIME ZONE current_setting('TimeZone')))", "CAST(strftime('%s', Date_Time) AS INTEGER)", $sql);
        if (str_contains($sql, 'information_schema.columns')) {
            return 'SELECT 1 WHERE ' . implode(' AND ', array_fill(0, substr_count($sql, '?'), '? IS NOT NULL'));
        }
        if (str_contains($sql, 'pg_advisory_xact_lock')) {
            return 'SELECT 1 WHERE ? IS NOT NULL';
        }
        return $sql;
    }
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return parent::prepare($this->translate($query), $options);
    }
    public function exec(string $statement): int|false
    {
        return parent::exec($this->translate($statement));
    }
}
function database(): PDO
{
    static $db;
    if (!$db) {
        $db = new FixturePDO('sqlite:' . __DIR__ . '/runtime/fixture.sqlite');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('PRAGMA foreign_keys = ON');
    }
    return $db;
}
function sendOtpEmail(string $email, string $name, string $code): void
{
    if (str_starts_with($email, 'fail@')) throw new RuntimeException('Simulated delivery failure.');
    database()->prepare('INSERT INTO test_mail (Email, Code) VALUES (?, ?)')->execute([$email, $code]);
}
function sendNotificationEmail(string $email, string $name, string $subject, string $message): void {}

$bootstrap = file_get_contents($root . '/api/bootstrap.php');
eval(substr($bootstrap, strpos($bootstrap, 'function reply(')));
require $root . '/api/schedule-helpers.php';
require $root . '/api/faculty-status.php';

if ($path === '/_test/session') {
    $id = (int) ($_GET['id'] ?? 1);
    $s = database()->prepare('SELECT * FROM users WHERE User_ID = ?');
    $s->execute([$id]);
    $_SESSION = [];
    $user = rememberUserSession(publicUser($s->fetch()));
    reply(['ok' => true, 'user' => $user, 'tab_token' => issueTabToken($user)]);
}
if ($path === '/_test/mail') {
    reply(['ok' => true, 'mail' => database()->query('SELECT * FROM test_mail ORDER BY rowid DESC LIMIT 1')->fetch()]);
}
if ($path === '/_test/fail-mail') {
    database()->exec("INSERT INTO account_verification_codes (Email,Role,Token,Code_Hash,Expires_At) VALUES ('fail@example.test','student','old-token','unused','2099-01-01')");
    reply(['ok' => true]);
}
if ($path === '/_test/old-mail') {
    reply(['ok' => true, 'codes' => database()->query("SELECT Token,Consumed_At FROM account_verification_codes WHERE Email = 'fail@example.test'")->fetchAll()]);
}
if (!preg_match('~^/api/[a-z-]+\.php$~', $path) || !is_file($root . $path)) {
    http_response_code(404); exit;
}
$source = file_get_contents($root . $path);
$source = preg_replace('~^<\?php\s*declare\(strict_types=1\);~', '', $source);
$source = str_replace(["require __DIR__ . '/bootstrap.php';", "require __DIR__ . '/mailer.php';"], '', $source);
eval($source);
