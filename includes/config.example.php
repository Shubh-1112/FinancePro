# Configuration Template

Copy this file to `includes/config.php` and update with your database credentials.

```php
<?php
/**
 * Database Configuration
 * Update these values with your local database settings
 */

// Database connection settings
define('DB_HOST', 'localhost');        // Database host (usually 'localhost')
define('DB_PORT', '3306');             // MySQL port (3306 default, 3307 for XAMPP)
define('DB_USER', 'root');             // Your MySQL username
define('DB_PASS', '');                 // Your MySQL password
define('DB_NAME', 'personal_finance_planner'); // Database name

// Site configuration
define('SITE_URL', 'http://localhost:8000'); // Your site URL
define('SITE_NAME', 'FinancePro');           // Site name

// Timezone
date_default_timezone_set('Asia/Kolkata'); // Set your timezone

// Database Class
class Database {
    private $conn;
    private $host;
    private $port;
    private $user;
    private $pass;
    private $dbname;

    public function __construct() {
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->user = DB_USER;
        $this->pass = DB_PASS;
        $this->dbname = DB_NAME;
    }

    public function connect() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->dbname . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->user, $this->pass);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            throw new Exception("Connection Error: " . $e->getMessage());
        }
        return $this->conn;
    }

    public function query($sql, $params = []) {
        $conn = $this->connect();
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    public function lastInsertId() {
        return $this->connect()->lastInsertId();
    }
}

// CORS headers for API requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
?>
```

## Important Notes

1. **Never commit the actual `config.php` file** - it contains sensitive credentials
2. Update `DB_PORT` to `3307` if using XAMPP on Mac
3. Set a strong password for production environments
4. Update `SITE_URL` to match your deployment URL
