<?php
session_start();
require_once '../includes/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    $contact = trim($_POST['contact'] ?? '');
    $dob = $_POST['dob'] ?? '';
    $termsAccepted = isset($_POST['termsAccepted']);

    // Validation
    $errors = [];

    if (empty($firstName) || empty($lastName) || empty($email) || empty($password) || empty($confirmPassword) || empty($contact) || empty($dob)) {
        $errors[] = 'All fields are required';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format';
    }

    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }

    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }

    if (!preg_match('/^[0-9]+$/', $contact)) {
        $errors[] = 'Contact number must contain only digits';
    }

    if (!$termsAccepted) {
        $errors[] = 'You must accept the terms and conditions';
    }

    if (!empty($errors)) {
            $msg = rawurlencode(implode(' | ', $errors));
            header('Location: ../register.html?type=error&msg=' . $msg);
            exit();
        }

    try {
        $db = new Database();

        // Generate username
        $username = $firstName . " " . $lastName;

        // Check if user already exists
        $existingUser = $db->fetch(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            [$email, $username]
        );

        if ($existingUser) {
            $msg = rawurlencode('User with this email or username already exists');
            header('Location: ../register.html?type=error&msg=' . $msg);
            exit();
        }

        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Insert user with full profile fields
        $db->execute(
            "INSERT INTO users (username, first_name, last_name, email, contact, dob, terms_accepted, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [$username, $firstName, $lastName, $email, $contact ?: null, $dob ?: null, $termsAccepted ? 1 : 0, $passwordHash]
        );

        $userId = $db->lastInsertId();

        // Create default budget data
        $db->execute(
            "INSERT INTO budget_data (user_id, income, savings_goal, duration) VALUES (?, ?, ?, ?)",
            [$userId, 0, 0, 'monthly']
        );

        // Create user points record
        $db->execute(
            "INSERT INTO user_points (user_id, total_points, months_under_budget) VALUES (?, ?, ?)",
            [$userId, 0, 0]
        );

    // Registration successful
    $msg = rawurlencode('Registration successful! Please login.');
    header('Location: ../login.html?type=success&msg=' . $msg);
    exit();

    } catch (Exception $e) {
        $msg = rawurlencode('Registration failed: ' . $e->getMessage());
        header('Location: ../register.html?type=error&msg=' . $msg);
        exit();
    }
} else {
    // If not POST, redirect to register page
    header('Location: ../register.html');
    exit();
}
?>
