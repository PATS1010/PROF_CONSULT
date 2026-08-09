<?php
// Load the database connection file so we can talk to MySQL
require_once 'config.php';

// If someone opens this page directly (not from the form), send them back
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: forgot-password.html');
    exit;
}

// Get what the user typed in the "Email or mobile number" box
$identifier = trim($_POST['identifier'] ?? '');
if (empty($identifier)) {
    // If empty, go back with an error message in the URL
    header('Location: forgot-password.html?error=' . urlencode('Please enter your email or mobile number.'));
    exit;
}

// Variables to remember who we found
$userType = null;  // 'faculty' or 'student'
$userId   = null;  // their ID number

// STEP 1: Search the FACULTY table
// Check if input matches faculty_id, contact_number, or full_name
$stmt = $pdo->prepare("SELECT faculty_id FROM faculty WHERE faculty_id = ? OR contact_number = ? OR full_name = ?");
$stmt->execute([$identifier, $identifier, $identifier]);
if ($row = $stmt->fetch()) {
    $userType = 'faculty';
    $userId = $row['faculty_id'];  // Save their faculty ID
}

// STEP 2: If not found in faculty, search the STUDENTS table
// Check if input matches student_number, email_address, mobile_number, or full_name
if (!$userType) {
    $stmt = $pdo->prepare("SELECT student_number FROM students WHERE student_number = ? OR email_address = ? OR mobile_number = ? OR full_name = ?");
    $stmt->execute([$identifier, $identifier, $identifier, $identifier]);
    if ($row = $stmt->fetch()) {
        $userType = 'student';
        $userId = $row['student_number'];  // Save their student number
    }
}

// STEP 3: If no user was found at all, show error
if (!$userType) {
    header('Location: forgot-password.html?error=' . urlencode('No account found with that information.'));
    exit;
}

// STEP 4: Create a 6-digit random code (example: 004237)
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Create a random secret token for security
$token = bin2hex(random_bytes(16));

// Code expires in 15 minutes
$expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

// STEP 5: Delete any old reset codes for this same user
// (So they don't have multiple active codes at once)
$pdo->prepare("DELETE FROM password_resets WHERE user_type = ? AND identifier = ?")->execute([$userType, $userId]);

// STEP 6: Save the new code into the password_resets table
$stmt = $pdo->prepare("INSERT INTO password_resets (user_type, identifier, reset_code, reset_token, expires_at) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$userType, $userId, $code, $token, $expires]);

// NOTE: In a real live website, you would send $code via email or SMS here.
// For school project / localhost testing, just look up the code in phpMyAdmin.

// STEP 7: Go to verification page, pass the secret token in the URL
header('Location: verification-code.html?token=' . urlencode($token));
exit;
?>