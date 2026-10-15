<?php
declare(strict_types=1);

// Deployment tool only; never expose migrations through an HTTP endpoint.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/api/app-config.php';
try {
    $changed = migrateDatabaseSchema(database());
    fwrite(STDOUT, $changed ? "Database migration applied.\n" : "Database schema is current.\n");
} catch (Throwable $exception) {
    // Keep connection details and credentials out of deployment output.
    fwrite(STDERR, "Database migration failed; application startup stopped. Check database configuration and availability.\n");
    exit(1);
}
