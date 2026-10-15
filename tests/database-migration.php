<?php
declare(strict_types=1);

require dirname(__DIR__) . '/api/config.php';

// Exercise the real migration lifecycle with transactional SQLite. PostgreSQL
// advisory locks and idempotent ALTER syntax still need deployment validation.
class MigrationPDO extends PDO
{
    public int $schemaRuns = 0;
    public bool $failSchema = false;

    public function __construct()
    {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function exec(string $statement): int|false
    {
        if (str_contains($statement, 'pg_advisory_xact_lock')) return 0;
        if (str_contains($statement, 'CREATE TABLE IF NOT EXISTS users')) {
            $this->schemaRuns++;
            $statement = str_replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY', $statement);
            $statement = preg_replace('/^ALTER TABLE [^\r\n]*;\r?$/m', '', $statement);
            $result = parent::exec($statement);
            if ($this->failSchema) throw new RuntimeException('Simulated migration failure');
            return $result;
        }
        return parent::exec($statement);
    }
}

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
    echo "PASS $message\n";
}

$db = new MigrationPDO();
check(migrateDatabaseSchema($db), 'First startup applies the schema');
$db->exec("INSERT INTO users (Username,Password,Full_Name,Email,Mobile_Number,Role)
    VALUES ('existing','hash','Existing User','existing@example.test','9123456789','student')");
$db->exec("INSERT INTO user_profile_photos VALUES (1,'image/png','existing-photo')");
check(!migrateDatabaseSchema($db) && $db->schemaRuns === 1, 'Restart skips application schema DDL');
check($db->query('SELECT Image_Data FROM user_profile_photos WHERE User_ID = 1')->fetchColumn() === 'existing-photo', 'Restart preserves existing accounts and photos');
check($db->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('account_verification_codes','password_reset_codes','faculty_presence')")->fetchColumn() === 3, 'Startup includes verification, reset, and presence tables');

// Simulate upgrading an existing database, then a failure after schema DDL.
$db->exec('DELETE FROM profconsult_schema_migrations');
$db->failSchema = true;
try {
    migrateDatabaseSchema($db);
    throw new LogicException('Migration should have failed');
} catch (RuntimeException $exception) {
    if ($exception->getMessage() !== 'Simulated migration failure') throw $exception;
}
check(!$db->inTransaction() && $db->query('SELECT COUNT(*) FROM profconsult_schema_migrations')->fetchColumn() === 0, 'Failed migration rolls back and does not record success');
check($db->query('SELECT COUNT(*) FROM users')->fetchColumn() === 1, 'Failed migration preserves existing accounts');
$db->failSchema = false;
check(migrateDatabaseSchema($db), 'A failed migration can be retried');
check(!migrateDatabaseSchema($db), 'Successful retry is recorded and skipped on restart');
