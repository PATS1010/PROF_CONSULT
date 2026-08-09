<?php
// Load database connection
require_once 'config.php';

// If opened directly without submitting the form, go back to forgot password
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: forgot-password.html');
    exit;
}

// Get the hidden token and the 6-digit code from the form
$token = trim($_POST['token'] ?? '');
$code  = trim($_POST['code'] ?? '');

// If either is missing, show error
if (empty($token) || empty($code)) {
    header('Location: verification-code.html?error=' . urlencode('Please enter the verification code.'));
    exit;
}

// STEP 1: Look in database for a matching code that:
// - Has the same token
// - Has the same 6-digit code
// - Has not been used yet (used = 0)
// - Has not expired (expires_at is still in the future)
$stmt = $pdo->prepare("SELECT * FROM password_resets WHERE reset_token = ? AND reset_code = ? AND used = 0 AND expires_at > NOW()");
$stmt->execute([$token, $code]);
$reset = $stmt->fetch();

// If nothing found, code is wrong or expired
if (!$reset) {
    header('Location: verification-code.html?token=' . urlencode($token) . '&error=' . urlencode('Invalid or expired code.'));
    exit;
}

// STEP 2: Mark this code as USED so it can't be used again
$pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")->execute([$reset['id']]);

// STEP 3: Create a NEW secret token for the next step (password reset page)
// This is for extra security — even if someone sees the URL, the old token won't work anymore
$newToken = bin2hex(random_bytes(16));
$pdo->prepare("UPDATE password_resets SET reset_token = ? WHERE id = ?")->execute([$newToken, $reset['id']]);

// STEP 4: Send user to "Create New Password" page
// Pass: new token, user type (faculty/student), and user ID
header('Location: create-new-password.html?token=' . urlencode($newToken) . '&type=' . urlencode($reset['user_type']) . '&id=' . urlencode($reset['identifier']));
exit;
?>