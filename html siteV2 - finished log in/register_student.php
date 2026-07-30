<?php
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: create-student-account.html');
    exit;
}

// Collect everything from Step 1 + Step 2
$studentNumber = trim($_POST['studentNumber'] ?? '');
$fullName      = trim($_POST['fullName']      ?? '');
$courseProgram = trim($_POST['courseProgram'] ?? '');
$yearLevel     = trim($_POST['yearLevel']     ?? '');
$emailAddress  = trim($_POST['emailAddress']  ?? '');
$mobileNumber  = trim($_POST['mobileNumber']  ?? '');
$password      = $_POST['password']           ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';
$agreeTerms    = isset($_POST['agreeTerms']);

$errors = [];

// Step 1 validation
if (empty($studentNumber) || !preg_match('/^\d{2}-\d{5}$/', $studentNumber)) {
    $errors[] = 'Invalid Student Number format (00-00000).';
}
if (empty($fullName)) {
    $errors[] = 'Full Name is required.';
}
if (empty($courseProgram)) {
    $errors[] = 'Course / Program is required.';
}
if (empty($yearLevel) || !in_array($yearLevel, ['1','2','3','4','5'], true)) {
    $errors[] = 'Invalid Year Level.';
}

// Step 2 validation
if (empty($emailAddress) || !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
$cleanMobile = preg_replace('/\D/', '', $mobileNumber);
if (strlen($cleanMobile) !== 10 || $cleanMobile[0] !== '9') {
    $errors[] = 'Enter a valid 10-digit mobile number (9xx-xxx-xxxx).';
}
if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password)) {
    $errors[] = 'Password must be at least 8 characters with one uppercase letter and one number.';
}
if ($password !== $confirmPassword) {
    $errors[] = 'Passwords do not match.';
}
if (!$agreeTerms) {
    $errors[] = 'You must agree to the Terms and Conditions.';
}

// Duplicate checks
if (empty($errors)) {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE student_number = ?");
    $stmt->execute([$studentNumber]);
    if ($stmt->fetch()) $errors[] = 'Student Number is already registered.';
}
if (empty($errors)) {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE email_address = ?");
    $stmt->execute([$emailAddress]);
    if ($stmt->fetch()) $errors[] = 'Email address is already registered.';
}

// Redirect back with error if any
if (!empty($errors)) {
    header('Location: create-student-account2.html?error=' . urlencode($errors[0]));
    exit;
}

// Insert
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO students (student_number, full_name, course_program, year_level, email_address, mobile_number, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)");

try {
    $stmt->execute([$studentNumber, $fullName, $courseProgram, $yearLevel, $emailAddress, $mobileNumber, $hash]);
    header('Location: student-login.html?registered=1');
} catch (PDOException $e) {
    header('Location: create-student-account2.html?error=' . urlencode('Database error. Please try again.'));
}
exit;
?>