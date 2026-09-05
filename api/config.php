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
 * Mail values now come from Vercel environment variables.
 * Add these later in Vercel, not inside this file.
 */
define('SMTP_HOST', env('SMTP_HOST', 'smtp-relay.brevo.com'));
define('SMTP_PORT', (int) env('SMTP_PORT', '587'));
define('SMTP_USERNAME', env('SMTP_USERNAME'));
define('SMTP_PASSWORD', env('SMTP_PASSWORD'));
define('SMTP_ENCRYPTION', env('SMTP_ENCRYPTION', 'tls'));
define('SMTP_FROM_EMAIL', env('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', env('SMTP_FROM_NAME', 'Prof Consult'));

function database(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $databaseUrl = env('DATABASE_URL');
    $parts = parse_url($databaseUrl);

    if (!is_array($parts) || empty($parts['host']) || empty($parts['user'])) {
        throw new RuntimeException('DATABASE_URL is invalid.');
    }

    $query = [];
    parse_str($parts['query'] ?? '', $query);

    $host = $parts['host'];
    $port = $parts['port'] ?? 5432;
    $databaseName = ltrim($parts['path'] ?? '/postgres', '/');
    $username = rawurldecode($parts['user']);
    $password = rawurldecode($parts['pass'] ?? '');
    $sslMode = $query['sslmode'] ?? 'require';

    $dsn = "pgsql:host={$host};port={$port};dbname={$databaseName};sslmode={$sslMode}";

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}