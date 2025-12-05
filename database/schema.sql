-- Personal Finance Planner Database Schema
CREATE DATABASE IF NOT EXISTS personal_finance_planner;
USE personal_finance_planner;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact VARCHAR(20) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    terms_accepted TINYINT(1) DEFAULT 0,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Budget data table
CREATE TABLE IF NOT EXISTS budget_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    income DECIMAL(10,2) NOT NULL DEFAULT 0,
    savings_goal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_savings DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration ENUM('weekly', 'monthly', 'yearly') DEFAULT 'monthly',
    income_increment_date INT DEFAULT NULL,
    income_increment_amount DECIMAL(10,2) DEFAULT NULL,
    last_increment_month VARCHAR(7) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    percentage DECIMAL(5,2) DEFAULT 0,
    is_fixed BOOLEAN DEFAULT FALSE,
    is_auto_added BOOLEAN DEFAULT FALSE,
    date_added DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Fixed expenses templates table
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '📦',
    due_date INT NOT NULL,
    last_added_month VARCHAR(7) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User points and rewards table
CREATE TABLE IF NOT EXISTS user_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_points INT DEFAULT 0,
    months_under_budget INT DEFAULT 0,
    months_no_shopping_entertainment INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_name)
);

-- Insert default categories
INSERT INTO categories (name, icon, color) VALUES
('Housing', '🏠', '#8B5CF6'),
('Food', '🍔', '#3B82F6'),
('Transport', '🚗', '#10B981'),
('Entertainment', '🎮', '#F59E0B'),
('Healthcare', '🏥', '#EF4444'),
('Shopping', '🛒', '#EC4899'),
('Utilities', '⚡', '#14B8A6'),
('Education', '📚', '#F97316'),
('Travel', '✈️', '#06B6D4'),
('Savings', '💰', '#22C55E'),
('Other', '📦', '#6366F1');

-- Income table
CREATE TABLE IF NOT EXISTS income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    date_added DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    feedback TEXT,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS feedback_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction ENUM('like','dislike') NOT NULL,
    UNIQUE(feedback_id, user_id),
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- No default user data - completely clean database
-- Users will start with completely empty data
