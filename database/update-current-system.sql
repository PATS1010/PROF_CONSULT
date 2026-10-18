-- PROF CONSULT current-system update, 2026-10-18.
-- Paste this entire file into the Supabase SQL Editor and run.
-- Updates public (the application schema), not profconsult_erd.
-- Keeps all 11 application tables and the deployment migration log.
-- Does not record a deployment version; deployment retains its own lifecycle.
-- Existing invalid relationships or conflicting duplicate hours stop the
-- transaction instead of deleting records.
BEGIN;
SET LOCAL search_path TO public;
SELECT pg_advisory_xact_lock(20261016, 1);

CREATE TABLE IF NOT EXISTS profconsult_schema_migrations (
    Version BIGINT PRIMARY KEY,
    Applied_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  User_ID SERIAL PRIMARY KEY,
  Username VARCHAR(50) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Full_Name VARCHAR(150) NOT NULL,
  Email VARCHAR(190) NOT NULL UNIQUE,
  Mobile_Number VARCHAR(20) NOT NULL,
  Profile_Photo VARCHAR(255) NULL,
  Email_Notifications BOOLEAN NOT NULL DEFAULT TRUE,
  Push_Notifications BOOLEAN NOT NULL DEFAULT TRUE,
  Role VARCHAR(20) NOT NULL CHECK (Role IN ('student', 'faculty', 'admin')),
  Account_Status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (Account_Status IN ('active', 'inactive', 'pending', 'blocked'))
);

CREATE TABLE IF NOT EXISTS faculty (
  Faculty_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Department VARCHAR(120) NOT NULL,
  Office VARCHAR(120) NULL,
  Consultation_Hours TEXT NULL
);

CREATE TABLE IF NOT EXISTS user_profile_photos (
  User_ID INTEGER PRIMARY KEY REFERENCES users(User_ID) ON DELETE CASCADE,
  Mime_Type VARCHAR(30) NOT NULL,
  Image_Data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  Student_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Program VARCHAR(120) NOT NULL,
  Year_Level VARCHAR(20) NOT NULL,
  Section VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_presence (
  Faculty_ID INTEGER PRIMARY KEY REFERENCES faculty(Faculty_ID) ON DELETE CASCADE,
  Checked_In BOOLEAN NOT NULL DEFAULT FALSE,
  Last_Seen TIMESTAMP NULL,
  Page_ID VARCHAR(64) NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  Notification_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL,
  Message TEXT NOT NULL,
  Date_Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Read_Status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (Read_Status IN ('read', 'unread'))
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  Reset_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL,
  Token CHAR(64) NOT NULL UNIQUE,
  Code_Hash VARCHAR(255) NOT NULL,
  Expires_At TIMESTAMP NOT NULL,
  Verified_At TIMESTAMP NULL,
  Consumed_At TIMESTAMP NULL,
  Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_verification_codes (
  Verification_ID SERIAL PRIMARY KEY,
  Email VARCHAR(190) NOT NULL,
  Role VARCHAR(20) NOT NULL CHECK (Role IN ('student', 'faculty')),
  Token CHAR(64) NOT NULL UNIQUE,
  Code_Hash VARCHAR(255) NOT NULL,
  Expires_At TIMESTAMP NOT NULL,
  Verified_At TIMESTAMP NULL,
  Consumed_At TIMESTAMP NULL,
  Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  Response TEXT NULL
);

CREATE TABLE IF NOT EXISTS availability (
  Availability_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Status VARCHAR(20) NOT NULL CHECK (Status IN ('available', 'unavailable', 'in class', 'meeting', 'on leave', 'consultation', 'offline')),
  Date DATE NOT NULL,
  Time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  Log_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Date DATE NOT NULL,
  Check_In TIME NULL,
  Check_Out TIME NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS User_ID SERIAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS Username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Full_Name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Email VARCHAR(190);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Mobile_Number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Profile_Photo VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS Email_Notifications BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS Push_Notifications BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS Role VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS Account_Status VARCHAR(20) DEFAULT 'active';

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Faculty_ID SERIAL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Department VARCHAR(120);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Office VARCHAR(120) NULL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS Consultation_Hours TEXT NULL;
ALTER TABLE faculty ALTER COLUMN Consultation_Hours TYPE TEXT;

ALTER TABLE students ADD COLUMN IF NOT EXISTS Student_ID SERIAL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS Program VARCHAR(120);
ALTER TABLE students ADD COLUMN IF NOT EXISTS Year_Level VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS Section VARCHAR(50);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Notification_ID SERIAL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Date_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS Read_Status VARCHAR(20) DEFAULT 'unread';

ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Reset_ID SERIAL;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS User_ID INTEGER;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Token CHAR(64);
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Code_Hash VARCHAR(255);
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Expires_At TIMESTAMP;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Verified_At TIMESTAMP NULL;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Consumed_At TIMESTAMP NULL;
ALTER TABLE password_reset_codes ADD COLUMN IF NOT EXISTS Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Request_ID SERIAL;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Student_ID INTEGER;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Purpose TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Additional_Message TEXT NULL;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Request_Date DATE;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Preferred_Time TIME;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS Response TEXT NULL;

ALTER TABLE availability ADD COLUMN IF NOT EXISTS Availability_ID SERIAL;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Status VARCHAR(20);
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Date DATE;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS Time TIME;

ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Log_ID SERIAL;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Faculty_ID INTEGER;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Date DATE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Check_In TIME NULL;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS Check_Out TIME NULL;

CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty (Department);
CREATE INDEX IF NOT EXISTS idx_students_program_year ON students (Program, Year_Level);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (User_ID, Read_Status);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_codes (Token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_active ON password_reset_codes (User_ID, Consumed_At);
CREATE INDEX IF NOT EXISTS idx_account_verification_token ON account_verification_codes (Token);
CREATE INDEX IF NOT EXISTS idx_account_verification_email_role ON account_verification_codes (Email, Role, Consumed_At);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_student ON consultation_requests (Student_ID, Status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_faculty ON consultation_requests (Faculty_ID, Status);
CREATE INDEX IF NOT EXISTS idx_availability_faculty_date ON availability (Faculty_ID, Date);
CREATE INDEX IF NOT EXISTS idx_availability_faculty_latest ON availability (Faculty_ID, Availability_ID DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_faculty_date ON attendance_logs (Faculty_ID, Date);

-- Remove the unused quoted duplicate shown in the supplied ER diagram.
-- Preserve its value when the application column is empty. Stop if the two
-- columns contain conflicting values so no consultation schedule is lost.
DO $cleanup$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'faculty'
          AND column_name = 'Consultation_Hours'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM public.faculty
            WHERE NULLIF(BTRIM(consultation_hours), '') IS NOT NULL
              AND NULLIF(BTRIM("Consultation_Hours"::text), '') IS NOT NULL
              AND consultation_hours IS DISTINCT FROM "Consultation_Hours"::text
        ) THEN
            RAISE EXCEPTION 'Conflicting consultation-hours columns: reconcile their values before running this update.';
        END IF;
        UPDATE public.faculty
        SET consultation_hours = "Consultation_Hours"::text
        WHERE NULLIF(BTRIM(consultation_hours), '') IS NULL
          AND NULLIF(BTRIM("Consultation_Hours"::text), '') IS NOT NULL;
        ALTER TABLE public.faculty DROP COLUMN "Consultation_Hours";
    END IF;
END;
$cleanup$;

-- Add missing foreign keys so every application relationship appears in ERD.
-- Match by table/column relationship to avoid duplicating differently named FKs.
DO $relationships$
DECLARE
    relation RECORD;
BEGIN
    FOR relation IN
        SELECT * FROM (VALUES
            ('faculty', 'user_id', 'users', 'user_id', 'fk_faculty_user'),
            ('students', 'user_id', 'users', 'user_id', 'fk_student_user'),
            ('faculty_presence', 'faculty_id', 'faculty', 'faculty_id', 'fk_presence_faculty'),
            ('user_profile_photos', 'user_id', 'users', 'user_id', 'fk_profile_photo_user'),
            ('notifications', 'user_id', 'users', 'user_id', 'fk_notification_user'),
            ('password_reset_codes', 'user_id', 'users', 'user_id', 'fk_password_reset_user'),
            ('consultation_requests', 'student_id', 'students', 'student_id', 'fk_consultation_request_student'),
            ('consultation_requests', 'faculty_id', 'faculty', 'faculty_id', 'fk_consultation_request_faculty'),
            ('availability', 'faculty_id', 'faculty', 'faculty_id', 'fk_availability_faculty'),
            ('attendance_logs', 'faculty_id', 'faculty', 'faculty_id', 'fk_attendance_log_faculty')
        ) AS relationships(child_table, child_column, parent_table, parent_column, constraint_name)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_attribute child_column
              ON child_column.attrelid = c.conrelid
             AND c.conkey = ARRAY[child_column.attnum]
            JOIN pg_attribute parent_column
              ON parent_column.attrelid = c.confrelid
             AND c.confkey = ARRAY[parent_column.attnum]
            WHERE c.contype = 'f'
              AND c.conrelid = to_regclass(format('public.%I', relation.child_table))
              AND c.confrelid = to_regclass(format('public.%I', relation.parent_table))
              AND child_column.attname = relation.child_column
              AND parent_column.attname = relation.parent_column
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I (%I) ON DELETE CASCADE',
                relation.child_table, relation.constraint_name, relation.child_column,
                relation.parent_table, relation.parent_column
            );
        END IF;
    END LOOP;
END;
$relationships$;

-- Registration verification happens before account creation, so its email
-- intentionally has no foreign key to users.
COMMIT;
