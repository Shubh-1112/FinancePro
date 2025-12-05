<?php
session_start();
require_once '../includes/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['error' => 'Please fill in all fields']);
        exit();
    }

    try {
        $db = new Database();

        // Check if user exists
        $user = $db->fetch(
            "SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?",
            [$username, $username]
        );

        if ($user && password_verify($password, $user['password_hash'])) {
            // Login successful
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true, 'redirect' => 'index.html']);
            exit();
        } else {
            echo json_encode(['error' => 'Invalid username or password']);
            exit();
        }
    } catch (Exception $e) {
        echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
        exit();
    }
} else {
    // If not POST, return error
    echo json_encode(['error' => 'Invalid request method']);
    exit();
}
?>
