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

    ensureDatabaseSchema($pdo);

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

function ensureDatabaseSchema(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
  User_ID SERIAL PRIMARY KEY,
  Username VARCHAR(50) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Full_Name VARCHAR(150) NOT NULL,
  Email VARCHAR(190) NOT NULL UNIQUE,
  Mobile_Number VARCHAR(20) NOT NULL,
  Profile_Photo VARCHAR(255) NULL,
  Role VARCHAR(20) NOT NULL CHECK (Role IN ('student', 'faculty', 'admin')),
  Account_Status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (Account_Status IN ('active', 'inactive', 'pending', 'blocked'))
);

CREATE TABLE IF NOT EXISTS faculty (
  Faculty_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Department VARCHAR(120) NOT NULL,
  Office VARCHAR(120) NULL,
  Consultation_Hours VARCHAR(255) NULL,
  CONSTRAINT fk_faculty_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  Student_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Program VARCHAR(120) NOT NULL,
  Year_Level VARCHAR(20) NOT NULL,
  Section VARCHAR(50) NOT NULL,
  CONSTRAINT fk_student_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  Notification_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL,
  Message TEXT NOT NULL,
  Date_Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Read_Status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (Read_Status IN ('read', 'unread')),
  CONSTRAINT fk_notification_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  Reset_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL,
  Token CHAR(64) NOT NULL UNIQUE,
  Code_Hash VARCHAR(255) NOT NULL,
  Expires_At TIMESTAMP NOT NULL,
  Verified_At TIMESTAMP NULL,
  Consumed_At TIMESTAMP NULL,
  Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  Request_ID SERIAL PRIMARY KEY,
  Student_ID INTEGER NOT NULL,
  Faculty_ID INTEGER NOT NULL,
  Purpose TEXT NOT NULL,
  Additional_Message TEXT NULL,
  Request_Date DATE NOT NULL,
  Preferred_Time TIME NOT NULL,
  Status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'declined', 'rescheduled', 'completed', 'cancelled')),
  Response TEXT NULL,
  CONSTRAINT fk_consultation_request_student
    FOREIGN KEY (Student_ID) REFERENCES students(Student_ID) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_request_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability (
  Availability_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Status VARCHAR(20) NOT NULL CHECK (Status IN ('available', 'unavailable', 'in class', 'meeting', 'on leave', 'consultation', 'offline')),
  Date DATE NOT NULL,
  Time TIME NOT NULL,
  CONSTRAINT fk_availability_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  Log_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Date DATE NOT NULL,
  Check_In TIME NULL,
  Check_Out TIME NULL,
  CONSTRAINT fk_attendance_log_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS Username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Full_Name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Email VARCHAR(190);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Mobile_Number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Profile_Photo VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS Role VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Account_Status VARCHAR(20) DEFAULT 'active';

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Department VARCHAR(120);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Office VARCHAR(120) NULL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Consultation_Hours VARCHAR(255) NULL;

ALTER TABLE students ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS Program VARCHAR(120);
ALTER TABLE students ADD COLUMN IF NOT EXISTS Year_Level VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS Section VARCHAR(50);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Date_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Read_Status VARCHAR(20) DEFAULT 'unread';

ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Token CHAR(64);
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Code_Hash VARCHAR(255);
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Expires_At TIMESTAMP;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Verified_At TIMESTAMP NULL;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Consumed_At TIMESTAMP NULL;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Student_ID INTEGER;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Purpose TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Additional_Message TEXT NULL;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Request_Date DATE;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Preferred_Time TIME;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Response TEXT NULL;

ALTER TABLE availability ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Status VARCHAR(20);
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Date DATE;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Time TIME;

ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Date DATE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Check_In TIME NULL;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Check_Out TIME NULL;

CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty (Department);
CREATE INDEX IF NOT EXISTS idx_students_program_year ON students (Program, Year_Level);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (User_ID, Read_Status);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_codes (Token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_active ON password_reset_codes (User_ID, Consumed_At);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_student ON consultation_requests (Student_ID, Status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_faculty ON consultation_requests (Faculty_ID, Status);
CREATE INDEX IF NOT EXISTS idx_availability_faculty_date ON availability (Faculty_ID, Date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_faculty_date ON attendance_logs (Faculty_ID, Date);
SQL);
}
