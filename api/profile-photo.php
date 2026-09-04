<?php
declare(strict_types=1);

// SYSTEM NOTE: Uploads and saves profile photos for student and faculty accounts.

require __DIR__ . '/bootstrap.php';

requirePost();
$user = currentUser();

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

    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        fail('Profile photo must be 5MB or smaller.');
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($tmpName);
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    if (!isset($extensions[$mimeType])) {
        fail('Please upload a JPG, PNG, WEBP, or GIF image.');
    }

    $uploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'profile-photos';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        fail('Unable to prepare the profile photo folder.', 500);
    }

    $fileName = sprintf(
        'user-%d-%s.%s',
        (int) $user['id'],
        bin2hex(random_bytes(8)),
        $extensions[$mimeType]
    );
    $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($tmpName, $targetPath)) {
        fail('Unable to save the profile photo.', 500);
    }

    $photoPath = 'uploads/profile-photos/' . $fileName;

    $statement = $db->prepare('SELECT Profile_Photo FROM users WHERE User_ID = ? LIMIT 1');
    $statement->execute([(int) $user['id']]);
    $previousPhoto = (string) ($statement->fetchColumn() ?: '');

    $update = $db->prepare('UPDATE users SET Profile_Photo = ? WHERE User_ID = ?');
    $update->execute([$photoPath, (int) $user['id']]);

    if ($previousPhoto !== '' && strpos($previousPhoto, 'uploads/profile-photos/') === 0) {
        $previousPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $previousPhoto);
        if (is_file($previousPath)) {
            unlink($previousPath);
        }
    }

    $_SESSION['user']['profile_photo'] = $photoPath;
    reply(['ok' => true, 'profile_photo' => $photoPath]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    fail('Unable to save the profile photo.', 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    fail('Unable to process the profile photo.', 500);
}
