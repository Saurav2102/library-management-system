-- ============================================
-- Library Management System - Database Schema
-- ============================================

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(10) DEFAULT 'Available',
    borrower VARCHAR(255) DEFAULT NULL,
    borrower_id VARCHAR(50) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: A complete 50+ real university book dataset is available in:
-- database/real_library_dataset.csv
