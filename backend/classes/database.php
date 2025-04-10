<?php
class Database {
    private $host, $db_name, $username, $password, $conn;
    private $max_attempts = 5;
    private $lockout_time = 900;

    public function __construct() {
        $config = require_once __DIR__ . '/../config/db_config.php';
        $this->host = $config['host'];
        $this->db_name = $config['db_name'];
        $this->username = $config['username'];
        $this->password = $config['password'];
    }

    public function connect() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->exec("SET NAMES 'utf8mb4'");
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            return false;
        }
        return $this->conn;
    }

    public function checkRateLimit($identifier) {
        session_start();
        $key = 'login_attempts_' . md5($identifier);
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = ['attempts' => 0, 'last_attempt' => time()];
        }
        if (time() - $_SESSION[$key]['last_attempt'] > $this->lockout_time) {
            $_SESSION[$key] = ['attempts' => 0, 'last_attempt' => time()];
        }
        return $_SESSION[$key]['attempts'] < $this->max_attempts;
    }

    public function updateAttempt($identifier) {
        session_start();
        $key = 'login_attempts_' . md5($identifier);
        $_SESSION[$key]['attempts']++;
        $_SESSION[$key]['last_attempt'] = time();
    }

    public function safeQuery($query, $params = [], $types = []) {
        try {
            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $type = isset($types[$key]) ? $types[$key] : PDO::PARAM_STR;
                $stmt->bindValue($key, $value, $type);
            }
            $stmt->execute();
            return $stmt;
        } catch(PDOException $e) {
            error_log("Query Error: " . $e->getMessage());
            return false;
        }
    }
}