<?php
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: create-faculty-account.html');
    exit;
}

// Collect everything from Step 1 + Step 2
$facultyIdNumber = trim($_POST['facultyIdNumber'] ?? '');
$fullName        = trim($_POST['fullName']        ?? '');
$department      = trim($_POST['department']      ?? '');
$contactNumber   = trim($_POST['contactNumber']   ?? '');
$password        = $_POST['password']             ?? '';
$confirmPassword = $_POST['confirmPassword']     ?? '';
$agreeTerms      = isset($_POST['agreeTerms']);

$errors = [];

// Step 1 validation
if (empty($facultyIdNumber) || !preg_match('/^\d{2}-\d{5}$/', $facultyIdNumber)) {
    $errors[] = 'Invalid Faculty ID format (00-00000).';
}
if (empty($fullName)) {
    $errors[] = 'Full Name is required.';
}
if (empty($department)) {
    $errors[] = 'Department is required.';
}

// Step 2 validation
$cleanContact = preg_replace('/\D/', '', $contactNumber);
if (strlen($cleanContact) !== 10 || $cleanContact[0] !== '9') {
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

// Duplicate check
if (empty($errors)) {
    $stmt = $pdo->prepare("SELECT id FROM faculty WHERE faculty_id = ?");
    $stmt->execute([$facultyIdNumber]);
    if ($stmt->fetch()) {
        $errors[] = 'Faculty ID is already registered.';
    }
}

// If errors, redirect back to Step 2 with error message in URL
if (!empty($errors)) {
    header('Location: create-faculty-account2.html?error=' . urlencode($errors[0]));
    exit;
}

// Insert
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO faculty (faculty_id, full_name, department, contact_number, password_hash) VALUES (?, ?, ?, ?, ?)");

try {
    $stmt->execute([$facultyIdNumber, $fullName, $department, $contactNumber, $hash]);
    header('Location: faculty-login.html?registered=1');
} catch (PDOException $e) {
    header('Location: create-faculty-account2.html?error=' . urlencode('Database error. Please try again.'));
}
exit;
?>