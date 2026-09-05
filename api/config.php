<?php

declare(strict_types=1);

function env(string $name, ?string $default = null): string
{
    $value = getenv($name);

    if ($value === false || $value === '') {
        if ($default !== null) {
            return $default;
        }

        throw new RuntimeException("Missing required environment variable: {$name}");
    }

    return $value;
}

/*
 * Mail values come from deployment environment variables.
 * Add these in Render or your local environment, not inside this file.
 */
define('SMTP_HOST', env('SMTP_HOST', 'smtp-relay.brevo.com'));
define('SMTP_PORT', (int) env('SMTP_PORT', '587'));
define('SMTP_USERNAME', env('SMTP_USERNAME', ''));
define('SMTP_PASSWORD', env('SMTP_PASSWORD', ''));
define('SMTP_ENCRYPTION', env('SMTP_ENCRYPTION', 'tls'));
define('SMTP_FROM_EMAIL', env('SMTP_FROM_EMAIL', ''));
define('SMTP_FROM_NAME', env('SMTP_FROM_NAME', 'Prof Consult'));

function database(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    [$dsn, $username, $password] = postgresConnectionParts(env('DATABASE_URL'));

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function postgresConnectionParts(string $databaseUrl): array
{
    $parts = parse_url($databaseUrl);

    if (!is_array($parts)) {
        throw new RuntimeException('DATABASE_URL is invalid.');
    }

    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['postgres', 'postgresql'], true)) {
        throw new RuntimeException('DATABASE_URL must use postgres:// or postgresql://.');
    }

    if (empty($parts['host']) || empty($parts['user']) || !array_key_exists('pass', $parts)) {
        throw new RuntimeException('DATABASE_URL must include host, username, and password.');
    }

    $databaseName = ltrim((string) ($parts['path'] ?? ''), '/');
    if ($databaseName === '') {
        throw new RuntimeException('DATABASE_URL must include a database name.');
    }

    $host = (string) $parts['host'];
    $port = (int) ($parts['port'] ?? 5432);
    $username = rawurldecode((string) $parts['user']);
    $password = rawurldecode((string) $parts['pass']);

    if ($username === '' || $password === '') {
        throw new RuntimeException('DATABASE_URL username and password must not be empty.');
    }

    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=require',
        $host,
        $port,
        rawurldecode($databaseName)
    );

    return [$dsn, $username, $password];
}
