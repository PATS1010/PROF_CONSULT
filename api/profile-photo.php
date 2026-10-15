<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $viewer = currentUser();
    $userId = (int) ($_GET['user_id'] ?? 0);

    try {
        $db = database();
        $statement = $db->prepare(
            'SELECT p.Mime_Type AS "Mime_Type", p.Image_Data AS "Image_Data", u.Role AS "Role"
             FROM user_profile_photos p
             INNER JOIN users u ON u.User_ID = p.User_ID
             WHERE p.User_ID = ? AND u.Account_Status = ?'
        );
        $statement->execute([$userId, 'active']);
        $photo = $statement->fetch();
        if (!$photo) {
            fail('Profile photo was not found.', 404);
        }
        if ($photo['Role'] !== 'faculty' && $viewer['role'] !== 'faculty' && $viewer['id'] !== $userId) {
            fail('You are not allowed to view this photo.', 403);
        }

        $bytes = base64_decode($photo['Image_Data'], true);
        if ($bytes === false) {
            fail('Unable to load profile photo.', 500);
        }
        header('Content-Type: ' . $photo['Mime_Type']);
        header('Content-Length: ' . strlen($bytes));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, no-cache');
        echo $bytes;
        exit;
    } catch (PDOException $exception) {
        error_log($exception->getMessage());
        fail('Unable to load profile photo.', 500);
    }
}

requirePost();
$requestedRole = clean((string) ($_POST['role'] ?? ''));
$user = in_array($requestedRole, ['student', 'faculty'], true)
    ? currentUser($requestedRole)
    : currentUser();

try {
    $db = database();
    ensureProfilePhotoColumn($db);
    if (empty($_FILES['profile_photo']) || !is_array($_FILES['profile_photo'])) {
        fail('Please choose a profile photo.');
    }
    $file = $_FILES['profile_photo'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('The profile photo could not be uploaded.');
    }
    $tmpName = (string) ($file['tmp_name'] ?? '');
    if (!is_uploaded_file($tmpName)) {
        fail('Please choose a valid profile photo.');
    }
    $size = filesize($tmpName);
    if ($size === false || $size === 0 || $size > 5 * 1024 * 1024) {
        fail('Profile photo must be a nonempty image of 5MB or smaller.');
    }
    $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($tmpName);
    if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
        fail('Please upload a JPG, PNG, WEBP, or GIF image.');
    }
    $bytes = file_get_contents($tmpName);
    if ($bytes === false || getimagesizefromstring($bytes) === false) {
        fail('Please upload a valid image.');
    }

    // Local upload folders may be erased when the application is redeployed.
    $db->beginTransaction();
    $photo = $db->prepare(
        'INSERT INTO user_profile_photos (User_ID, Mime_Type, Image_Data) VALUES (?, ?, ?)
         ON CONFLICT (User_ID) DO UPDATE SET Mime_Type = EXCLUDED.Mime_Type, Image_Data = EXCLUDED.Image_Data'
    );
    $photo->execute([(int) $user['id'], $mimeType, base64_encode($bytes)]);
    $photoPath = 'api/profile-photo.php?user_id=' . (int) $user['id'];
    $update = $db->prepare('UPDATE users SET Profile_Photo = ? WHERE User_ID = ?');
    $update->execute([$photoPath, (int) $user['id']]);
    $db->commit();

    $user['profile_photo'] = $photoPath;
    rememberUserSession($user);
    reply(['ok' => true, 'profile_photo' => $photoPath]);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    fail('Unable to save the profile photo.', 500);
}
