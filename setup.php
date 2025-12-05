<?php
// Database Setup Script
// Run this once to initialize the database

require_once 'includes/config.php';

try {
    // First, try to connect without specifying database to create it
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    echo "✓ Database '" . DB_NAME . "' created or already exists<br>";
    
    // Now connect to the specific database
    $db = new Database();
    
    // Read and execute the schema file
    $schemaFile = 'database/schema.sql';
    if (file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        
        // Split the schema into individual queries
        $queries = array_filter(array_map('trim', explode(';', $schema)));
        
        foreach ($queries as $query) {
            if (!empty($query) && !preg_match('/^(CREATE DATABASE|USE)/', $query)) {
                try {
                    $db->execute($query);
                } catch (Exception $e) {
                    // Some queries might fail if tables already exist, which is okay
                    if (!strpos($e->getMessage(), 'already exists')) {
                        throw $e;
                    }
                }
            }
        }
        
        echo "✓ Database schema initialized successfully<br>";
        
        // Check if we have sample data
        $result = $db->fetch("SELECT COUNT(*) as count FROM users");
        if ($result['count'] > 0) {
            echo "✓ Sample data already exists<br>";
        } else {
            echo "⚠ No sample data found - the schema should include default data<br>";
        }
        
        echo "<br><strong>Setup completed successfully!</strong><br><br>";
        echo "You can now access your application at: <a href='index.html'>index.html</a><br>";
        echo "<br><em>For security, delete this setup.php file after use.</em>";
        
    } else {
        throw new Exception("Schema file not found: " . $schemaFile);
    }
    
} catch (Exception $e) {
    echo "<strong>Error:</strong> " . $e->getMessage() . "<br>";
    echo "<br><strong>Make sure:</strong><br>";
    echo "1. MySQL is running on port " . DB_PORT . "<br>";
    echo "2. The database user '" . DB_USER . "' has proper permissions<br>";
    echo "3. The schema.sql file exists in the database/ folder<br>";
}
?>