<?php
// =========================================================
// verify-code.php
// NEW FILE — your verification-code.html submits to this.
// Receives the 6-digit code + token, validates against DB,
// then redirects to create-new-password.html with credentials.
// =========================================================

session_start();
require_once 'config.php';

// Guard: if opened directly without POST, send back to start
// Same pattern used in forgot-password.php from previous convo
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: forgot-password.html');
    exit;
}

// Get the hidden token and the combined 6-digit code
// 'token'  = hidden input filled from URL by JS in verification-code.html
// 'code'   = combined value from the 6 digit boxes, assembled by JS before submit
$token = trim($_POST['token'] ?? '');
$code  = trim($_POST['code'] ?? '');

// Basic validation — don't let empty submissions through
if (empty($token) || empty($code)) {
    header('Location: verification-code.html?error=' . urlencode('Please enter the verification code.'));
    exit;
}

// Look up the reset record by token AND code, and make sure it hasn't expired
// This matches the token & code created in forgot-password.php from previous convo
$stmt = $pdo->prepare("
    SELECT * FROM password_resets 
    WHERE reset_token = ? 
      AND reset_code = ? 
      AND expires_at > NOW()
    LIMIT 1
");
$stmt->execute([$token, $code]);
$reset = $stmt->fetch();

// If nothing found, the code is wrong or expired
if (!$reset) {
    // Send back to verification page, preserving the token so user doesn't restart
    header('Location: verification-code.html?token=' . urlencode($token) 
         . '&error=' . urlencode('Invalid or expired verification code.'));
    exit;
}

// Success! Code is valid. Redirect to create-new-password.html
// Pass token, type, and id in URL so the hidden inputs in 
// create-new-password.html (from previous convo) can auto-fill them
header('Location: create-new-password.html?token=' . urlencode($token) 
     . '&type=' . urlencode($reset['user_type']) 
     . '&id=' . urlencode($reset['identifier']));
exit;
?>