The container serves the existing application with Apache on port 10000, with
eight concurrent PHP workers and opcode caching. API responses retain their
existing private/no-store headers; no authenticated response cache is added.
Login proofs, role checks, notifications, and presence intervals are unchanged.

Startup runs `php database/apply-schema-migrations.php` before accepting traffic. Schema changes
run in a transaction with a PostgreSQL advisory lock; a version record prevents
repeating application DDL on restarts. Failure stops startup. No account, photo,
schedule, or consultation data is deleted. Do not import `database/schema.sql`
into a live database: that file is the destructive fresh-install/test fixture.

For an existing XAMPP/manual installation, configure DATABASE_URL in the PHP CLI
environment and run `php database/apply-schema-migrations.php` once before serving the updated
code. PHP CLI needs pdo_pgsql enabled. Docker handles this automatically.
Increment DATABASE_SCHEMA_VERSION in api/app-config.php when changing the migration
schema. Keep migration SQL idempotent for existing installations.

After deployment, check that startup reports migration success and Apache starts.
Verify student/faculty login, pasted-URL rejection, private photos, notifications,
check-in/check-out, and consultation creation/rescheduling. Compare authenticated
page/API timings after startup; hosting wake-up and email-provider latency may
still affect some requests. Verification email delivery remains synchronous.

Run `python tests/run_regressions.py` for the local endpoint/browser suite. It
also exercises migration apply/skip/rollback/retry using SQLite. This does not
replace a PostgreSQL migration test or a container build/start test.
