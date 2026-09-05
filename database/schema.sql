-- SYSTEM NOTE: PostgreSQL/Supabase schema for accounts, profiles, availability, notifications, and consultation requests.

DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS password_reset_codes CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USER TABLE
-- ============================================================
CREATE TABLE users (
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

-- ============================================================
-- FACULTY TABLE
-- ============================================================
CREATE TABLE faculty (
  Faculty_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Department VARCHAR(120) NOT NULL,
  Office VARCHAR(120) NULL,
  Consultation_Hours VARCHAR(255) NULL,
  CONSTRAINT fk_faculty_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE INDEX idx_faculty_department ON faculty (Department);

-- ============================================================
-- STUDENT TABLE
-- ============================================================
CREATE TABLE students (
  Student_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL UNIQUE,
  Program VARCHAR(120) NOT NULL,
  Year_Level VARCHAR(20) NOT NULL,
  Section VARCHAR(50) NOT NULL,
  CONSTRAINT fk_student_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE INDEX idx_students_program_year ON students (Program, Year_Level);

-- ============================================================
-- NOTIFICATION TABLE
-- ============================================================
CREATE TABLE notifications (
  Notification_ID SERIAL PRIMARY KEY,
  User_ID INTEGER NOT NULL,
  Message TEXT NOT NULL,
  Date_Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Read_Status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (Read_Status IN ('read', 'unread')),
  CONSTRAINT fk_notification_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_read ON notifications (User_ID, Read_Status);

-- ============================================================
-- PASSWORD RESET OTP TABLE
-- Stores hashed email OTP codes for forgot-password verification.
-- ============================================================
CREATE TABLE password_reset_codes (
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

CREATE INDEX idx_password_reset_token ON password_reset_codes (Token);
CREATE INDEX idx_password_reset_user_active ON password_reset_codes (User_ID, Consumed_At);

-- ============================================================
-- CONSULTATION REQUEST TABLE
-- ============================================================
CREATE TABLE consultation_requests (
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

CREATE INDEX idx_consultation_requests_student ON consultation_requests (Student_ID, Status);
CREATE INDEX idx_consultation_requests_faculty ON consultation_requests (Faculty_ID, Status);

-- ============================================================
-- AVAILABILITY TABLE
-- ============================================================
CREATE TABLE availability (
  Availability_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Status VARCHAR(20) NOT NULL CHECK (Status IN ('available', 'unavailable', 'in class', 'meeting', 'on leave', 'consultation', 'offline')),
  Date DATE NOT NULL,
  Time TIME NOT NULL,
  CONSTRAINT fk_availability_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE
);

CREATE INDEX idx_availability_faculty_date ON availability (Faculty_ID, Date);

-- ============================================================
-- ATTENDANCE LOG TABLE
-- ============================================================
CREATE TABLE attendance_logs (
  Log_ID SERIAL PRIMARY KEY,
  Faculty_ID INTEGER NOT NULL,
  Date DATE NOT NULL,
  Check_In TIME NULL,
  Check_Out TIME NULL,
  CONSTRAINT fk_attendance_log_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_logs_faculty_date ON attendance_logs (Faculty_ID, Date);
