-- Database Schema for FaceSecureAI (MySQL 8)
-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS facesecureai;
USE facesecureai;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User Roles Table (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Face Embeddings Table (Stores 128-dimensional facial embedding vectors)
CREATE TABLE IF NOT EXISTS face_embeddings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    embedding TEXT NOT NULL, -- Stored as a JSON array of 128 floats: [0.123, -0.456, ...]
    image_path VARCHAR(255) NOT NULL, -- Storage path of the enrolled picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- PRESENT, LATE, EARLY_DEPART, ABSENT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_date (user_id, date),
    INDEX idx_user_date (user_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Recognition Logs Table (Logs every face scan result)
CREATE TABLE IF NOT EXISTS recognition_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    matched_user_id BIGINT, -- Can be NULL for unknown faces
    confidence DOUBLE NOT NULL, -- Confidence percentage (e.g. 98.5)
    snapshot_path VARCHAR(255), -- File path for verification evidence image
    status VARCHAR(20) NOT NULL, -- SUCCESS, UNKNOWN, FAILURE
    device_info VARCHAR(100), -- Which camera / terminal scanned the face
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_scan_time (scan_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Audit Trail Table (Enterprise Logging of admin operations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL, -- e.g. USER_CREATE, USER_DELETE, EXPORT_EXCEL
    performed_by VARCHAR(50) NOT NULL, -- Username or "SYSTEM"
    details TEXT, -- JSON or key-value details of the action
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Base Roles
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO roles (name) VALUES ('ROLE_USER') ON DUPLICATE KEY UPDATE name=name;
