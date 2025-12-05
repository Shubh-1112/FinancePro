<?php
session_start();
require_once '../includes/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $identifier = trim($input['identifier'] ?? '');
    $otp = trim($input['otp'] ?? '');

    if (empty($identifier) || empty($otp)) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit();
    }

    // Validate OTP format (6 digits)
    if (!preg_match('/^\d{6}$/', $otp)) {
        echo json_encode(['success' => false, 'error' => 'Invalid OTP format']);
        exit();
    }

    try {
        $db = new Database();

        // Find the token
        $tokenData = $db->fetch(
            "SELECT prt.*, u.id as user_id, u.email, u.first_name 
             FROM password_reset_tokens prt
             JOIN users u ON prt.user_id = u.id
             WHERE prt.identifier = ? AND prt.token = ? AND prt.is_used = 0
             ORDER BY prt.created_at DESC LIMIT 1",
            [$identifier, $otp]
        );

        if (!$tokenData) {
            echo json_encode([
                'success' => false,
                'error' => 'Invalid verification code. Please check and try again.'
            ]);
            exit();
        }

        // Check if OTP has expired
        $expiresAt = strtotime($tokenData['expires_at']);
        $now = time();

        if ($now > $expiresAt) {
            echo json_encode([
                'success' => false,
                'error' => 'Verification code has expired. Please request a new one.',
                'expired' => true
            ]);
            exit();
        }

        // Mark OTP as used
        $db->execute(
            "UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?",
            [$tokenData['id']]
        );

        // Generate a temporary reset token for password reset step
        $resetToken = bin2hex(random_bytes(32));
        
        // Store reset token in session (valid for 15 minutes)
        $_SESSION['password_reset_token'] = $resetToken;
        $_SESSION['password_reset_user_id'] = $tokenData['user_id'];
        $_SESSION['password_reset_expires'] = time() + 900; // 15 minutes

        echo json_encode([
            'success' => true,
            'message' => 'Verification successful',
            'resetToken' => $resetToken
        ]);
        exit();

    } catch (Exception $e) {
        error_log("Verify OTP Error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => 'An error occurred. Please try again later.'
        ]);
        exit();
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}
?>
