<?php
session_start();
session_destroy();

// Return JSON response instead of redirecting
header('Content-Type: application/json');
echo json_encode(['success' => true]);
exit();
?>
