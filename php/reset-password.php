<?php
session_start();
require_once '../includes/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $resetToken = trim($input['resetToken'] ?? '');
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';

    // Validate reset token from session
    if (empty($resetToken) || 
        !isset($_SESSION['password_reset_token']) || 
        $_SESSION['password_reset_token'] !== $resetToken) {
        echo json_encode(['success' => false, 'error' => 'Invalid or expired reset session']);
        exit();
    }

    // Check if reset token has expired
    if (!isset($_SESSION['password_reset_expires']) || time() > $_SESSION['password_reset_expires']) {
        // Clear session
        unset($_SESSION['password_reset_token']);
        unset($_SESSION['password_reset_user_id']);
        unset($_SESSION['password_reset_expires']);
        
        echo json_encode(['success' => false, 'error' => 'Reset session has expired. Please start over.']);
        exit();
    }

    $userId = $_SESSION['password_reset_user_id'];

    // Validate passwords
    $errors = [];

    if (empty($newPassword) || empty($confirmPassword)) {
        $errors[] = 'Both password fields are required';
    }

    if (strlen($newPassword) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }

    if (!preg_match('/[a-z]/', $newPassword)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }

    if (!preg_match('/[A-Z]/', $newPassword)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }

    if (!preg_match('/[0-9]/', $newPassword)) {
        $errors[] = 'Password must contain at least one number';
    }

    if (!preg_match('/[^A-Za-z0-9]/', $newPassword)) {
        $errors[] = 'Password must contain at least one special character';
    }

    if ($newPassword !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }

    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'error' => implode('. ', $errors),
            'errors' => $errors
        ]);
        exit();
    }

    try {
        $db = new Database();

        // Hash the new password
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        // Update user password
        $db->execute(
            "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
            [$passwordHash, $userId]
        );

        // Invalidate all password reset tokens for this user
        $db->execute(
            "UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = ?",
            [$userId]
        );

        // Clear reset session
        unset($_SESSION['password_reset_token']);
        unset($_SESSION['password_reset_user_id']);
        unset($_SESSION['password_reset_expires']);

        echo json_encode([
            'success' => true,
            'message' => 'Password reset successful! You can now login with your new password.'
        ]);
        exit();

    } catch (Exception $e) {
        error_log("Reset Password Error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => 'An error occurred while resetting your password. Please try again.'
        ]);
        exit();
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}
?>
