<?php
session_start();
require_once '../includes/config.php';
require_once '../includes/EmailService.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $identifier = trim($input['identifier'] ?? '');

    if (empty($identifier)) {
        echo json_encode(['success' => false, 'error' => 'Missing identifier']);
        exit();
    }

    try {
        $db = new Database();

        // Get user
        $user = $db->fetch(
            "SELECT id, username, first_name, email FROM users WHERE email = ? OR contact = ?",
            [$identifier, $identifier]
        );

        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit();
        }

        // Check last resend time (120 second cooldown)
        $lastToken = $db->fetch(
            "SELECT last_resend_at FROM password_reset_tokens 
             WHERE user_id = ? AND identifier = ? 
             ORDER BY created_at DESC LIMIT 1",
            [$user['id'], $identifier]
        );

        if ($lastToken && $lastToken['last_resend_at']) {
            $lastResend = strtotime($lastToken['last_resend_at']);
            $timeSince = time() - $lastResend;
            
            if ($timeSince < 120) {
                $waitTime = 120 - $timeSince;
                echo json_encode([
                    'success' => false,
                    'error' => "Please wait {$waitTime} seconds before requesting a new code.",
                    'waitTime' => $waitTime
                ]);
                exit();
            }
        }

        // Generate new 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Set expiry time (10 minutes from now)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        // Invalidate all previous tokens for this user
        $db->execute(
            "UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = ? AND is_used = 0",
            [$user['id']]
        );

        // Insert new OTP token
        $db->execute(
            "INSERT INTO password_reset_tokens (user_id, identifier, token, expires_at, last_resend_at) 
             VALUES (?, ?, ?, ?, NOW())",
            [$user['id'], $identifier, $otp, $expiresAt]
        );

        // Send OTP via email
        $emailSent = EmailService::sendOTP($user['email'], $otp, $user['first_name']);

        $response = [
            'success' => true,
            'message' => 'New verification code sent to your email.',
            'expiresIn' => 600, // 10 minutes in seconds
            'cooldown' => 120 // 2 minutes cooldown
        ];

        // In development mode, include OTP in response
        if (defined('DEV_MODE') && DEV_MODE) {
            $response['otp'] = $otp;
            $response['dev_mode'] = true;
        }

        echo json_encode($response);
        exit();

    } catch (Exception $e) {
        error_log("Resend OTP Error: " . $e->getMessage());
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
