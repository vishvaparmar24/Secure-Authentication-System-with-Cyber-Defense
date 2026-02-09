USE secure_login_system;

-- 1. User Risk Scores check
CREATE TABLE IF NOT EXISTS user_risk_scores (
    user_id INT PRIMARY KEY,
    risk_score INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Blocked IPs
CREATE TABLE IF NOT EXISTS blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    reason VARCHAR(255),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP NULL
);

-- 3. Login Devices (Fingerprinting)
CREATE TABLE IF NOT EXISTS login_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    device_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Enhance Security Logs (Add severity if not exists)
-- This is a bit tricky in pure SQL without stored procedures to check column existence in MySQL 5.7+ simply.
-- We will just try to add it and ignore error if exists or recreate.
-- For simplicity in this script, we assume standard structure.
-- We will add 'severity' and 'risk_score' columns.

-- ALTER TABLE security_logs ADD COLUMN severity ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'INFO';
-- ALTER TABLE security_logs ADD COLUMN risk_score INT DEFAULT 0;

-- Easier way for development: Keep security_logs as is, but ensuring we can insert these values.
-- Let's just create a new enriched table for 'threat_events' or modify the code to use JSON in description if we can't alter easily.
-- actually, let's try to ALTER. If it fails (already exists), it's fine.

SET @dbname = DATABASE();
SET @tablename = "security_logs";
SET @columnname = "severity";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE security_logs ADD COLUMN severity ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'INFO';"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname2 = "risk_score";
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE security_logs ADD COLUMN risk_score INT DEFAULT 0;"
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;
