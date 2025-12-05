-- Password Reset Tokens Migration
-- This table stores OTP tokens for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    identifier VARCHAR(255) NOT NULL COMMENT 'Email or contact used for reset',
    token VARCHAR(6) NOT NULL COMMENT '6-digit OTP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'OTP expires 10 minutes after creation',
    is_used TINYINT(1) DEFAULT 0 COMMENT 'Prevents OTP reuse',
    last_resend_at TIMESTAMP NULL COMMENT 'Tracks resend cooldown',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_identifier (identifier)
);
