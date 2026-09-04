-- SYSTEM NOTE: Defines the database schema used by accounts, profiles, availability, notifications, and consultation requests.
CREATE DATABASE IF NOT EXISTS prof_consult CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prof_consult;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendance_logs;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS consultation_requests;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_codes;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS faculty;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USER TABLE
-- ============================================================
CREATE TABLE users (
  User_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(50) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Full_Name VARCHAR(150) NOT NULL,
  Email VARCHAR(190) NOT NULL UNIQUE,
  Mobile_Number VARCHAR(20) NOT NULL,
  Profile_Photo VARCHAR(255) NULL,
  Role ENUM('student', 'faculty', 'admin') NOT NULL,
  Account_Status ENUM('active', 'inactive', 'pending', 'blocked') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB;

-- ============================================================
-- FACULTY TABLE
-- ============================================================
CREATE TABLE faculty (
  Faculty_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  User_ID INT UNSIGNED NOT NULL UNIQUE,
  Department VARCHAR(120) NOT NULL,
  Office VARCHAR(120) NULL,
  Consultation_Hours VARCHAR(255) NULL,
  CONSTRAINT fk_faculty_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE,
  INDEX idx_faculty_department (Department)
) ENGINE=InnoDB;

-- ============================================================
-- STUDENT TABLE
-- ============================================================
CREATE TABLE students (
  Student_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  User_ID INT UNSIGNED NOT NULL UNIQUE,
  Program VARCHAR(120) NOT NULL,
  Year_Level VARCHAR(20) NOT NULL,
  Section VARCHAR(50) NOT NULL,
  CONSTRAINT fk_student_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE,
  INDEX idx_students_program_year (Program, Year_Level)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATION TABLE
-- ============================================================
CREATE TABLE notifications (
  Notification_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  User_ID INT UNSIGNED NOT NULL,
  Message TEXT NOT NULL,
  Date_Time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Read_Status ENUM('read', 'unread') NOT NULL DEFAULT 'unread',
  CONSTRAINT fk_notification_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (User_ID, Read_Status)
) ENGINE=InnoDB;

-- ============================================================
-- PASSWORD RESET OTP TABLE
-- Stores hashed email OTP codes for forgot-password verification.
-- ============================================================
CREATE TABLE password_reset_codes (
  Reset_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  User_ID INT UNSIGNED NOT NULL,
  Token CHAR(64) NOT NULL UNIQUE,
  Code_Hash VARCHAR(255) NOT NULL,
  Expires_At DATETIME NOT NULL,
  Verified_At DATETIME NULL,
  Consumed_At DATETIME NULL,
  Created_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE,
  INDEX idx_password_reset_token (Token),
  INDEX idx_password_reset_user_active (User_ID, Consumed_At)
) ENGINE=InnoDB;

-- ============================================================
-- CONSULTATION REQUEST TABLE
-- ============================================================
CREATE TABLE consultation_requests (
  Request_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Student_ID INT UNSIGNED NOT NULL,
  Faculty_ID INT UNSIGNED NOT NULL,
  Purpose TEXT NOT NULL,
  Additional_Message TEXT NULL,
  Request_Date DATE NOT NULL,
  Preferred_Time TIME NOT NULL,
  Status ENUM('pending', 'approved', 'declined', 'rescheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  Response TEXT NULL,
  CONSTRAINT fk_consultation_request_student
    FOREIGN KEY (Student_ID) REFERENCES students(Student_ID) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_request_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE,
  INDEX idx_consultation_requests_student (Student_ID, Status),
  INDEX idx_consultation_requests_faculty (Faculty_ID, Status)
) ENGINE=InnoDB;

-- ============================================================
-- AVAILABILITY TABLE
-- ============================================================
CREATE TABLE availability (
  Availability_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Faculty_ID INT UNSIGNED NOT NULL,
  Status ENUM('available', 'unavailable', 'in class', 'meeting', 'on leave', 'consultation', 'offline') NOT NULL,
  Date DATE NOT NULL,
  Time TIME NOT NULL,
  CONSTRAINT fk_availability_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE,
  INDEX idx_availability_faculty_date (Faculty_ID, Date)
) ENGINE=InnoDB;

-- ============================================================
-- ATTENDANCE LOG TABLE
-- ============================================================
CREATE TABLE attendance_logs (
  Log_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Faculty_ID INT UNSIGNED NOT NULL,
  Date DATE NOT NULL,
  Check_In TIME NULL,
  Check_Out TIME NULL,
  CONSTRAINT fk_attendance_log_faculty
    FOREIGN KEY (Faculty_ID) REFERENCES faculty(Faculty_ID) ON DELETE CASCADE,
  INDEX idx_attendance_logs_faculty_date (Faculty_ID, Date)
) ENGINE=InnoDB;
