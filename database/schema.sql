CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(10) DEFAULT 'Available',
    borrower VARCHAR(255) DEFAULT NULL,
    issue_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO books (title, author, isbn, category, status, borrower, issue_date, due_date) VALUES
('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', '978-0135957059', 'Technology', 'Available', NULL, NULL, NULL),
('Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 'Issued', 'Alice Johnson', '2026-11-10', '2026-11-24'),
('Design Patterns', 'Gang of Four', '978-0201633610', 'Technology', 'Available', NULL, NULL, NULL),
('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Academics', 'Available', NULL, NULL, NULL),
('Database System Concepts', 'Abraham Silberschatz', '978-0078022159', 'Academics', 'Issued', 'Bob Smith', '2026-11-15', '2026-11-29'),
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'Available', NULL, NULL, NULL),
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 'Available', NULL, NULL, NULL),
('Sapiens', 'Yuval Noah Harari', '978-0062316097', 'Non-Fiction', 'Available', NULL, NULL, NULL),
('Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 'Issued', 'Charlie Davis', '2026-11-18', '2026-12-02'),
('The Art of War', 'Sun Tzu', '978-1599869773', 'Philosophy', 'Available', NULL, NULL, NULL);
