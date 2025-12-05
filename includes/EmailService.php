<?php
require_once __DIR__ . '/email-config.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * Email Service Class
 * Handles sending emails with OTP for password reset using PHPMailer
 */
class EmailService {
    
    /**
     * Send OTP email to user
     * 
     * @param string $to Recipient email address
     * @param string $otp 6-digit OTP code
     * @param string $userName User's name
     * @return bool Success status
     */
    public static function sendOTP($to, $otp, $userName = 'User') {
        // If email is not enabled, return true (dev mode will show OTP in response)
        if (!EMAIL_ENABLED) {
            error_log("OTP Email (Dev Mode): {$otp} for {$to}");
            return true;
        }

        try {
            $mail = new PHPMailer(true);
            
            // Server settings
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USERNAME;
            $mail->Password   = SMTP_PASSWORD;
            $mail->SMTPSecure = SMTP_ENCRYPTION === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = SMTP_PORT;
            
            // Enable verbose debug output (optional, comment out in production)
            // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
            
            // Recipients
            $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            $mail->addAddress($to, $userName);
            $mail->addReplyTo(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            
            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Your Password Reset Code - FinancePro';
            $mail->Body    = self::getEmailTemplate($otp, $userName);
            $mail->AltBody = "Your password reset code is: {$otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.";
            
            // Send email
            $mail->send();
            
            error_log("OTP Email sent successfully to: {$to}");
            return true;
            
        } catch (Exception $e) {
            error_log("Email Error: {$mail->ErrorInfo}");
            error_log("Exception: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get HTML email template for OTP
     * 
     * @param string $otp 6-digit OTP code
     * @param string $userName User's name
     * @return string HTML email template
     */
    private static function getEmailTemplate($otp, $userName) {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6, #14b8a6); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                💸 FinancePro
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                                Password Reset Request
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                                Hello {$userName},
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Use the verification code below to proceed:
                            </p>
                            
                            <!-- OTP Box -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #14b8a6); padding: 20px 40px; border-radius: 12px;">
                                            <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                {$otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                                This code will expire in <strong style="color: #ef4444;">10 minutes</strong>.
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                            
                            <!-- Security Notice -->
                            <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>Security Tip:</strong> Never share this code with anyone. FinancePro will never ask for your verification code.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                                © 2025 FinancePro. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
?>
