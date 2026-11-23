const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const initTable = async () => {
    try {
        await pool.query(`
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
        `);

        const countRes = await pool.query('SELECT COUNT(*) FROM books');
        if (parseInt(countRes.rows[0].count) === 0) {
            await pool.query(`
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
            `);
        }
    } catch (err) {
        console.error('Database init error:', err.message);
    }
};
initTable();

app.get('/api/books', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM books ORDER BY id ASC';
        let params = [];

        if (search) {
            query = 'SELECT * FROM books WHERE LOWER(title) LIKE $1 OR LOWER(author) LIKE $1 ORDER BY id ASC';
            params = [`%${search.toLowerCase()}%`];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const { title, author, isbn, category } = req.body;

        if (!title || !author || !isbn || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const query = 'INSERT INTO books (title, author, isbn, category) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [title, author, isbn, category]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A book with this ISBN already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.patch('/api/books/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { borrower, due_date } = req.body;

        const current = await pool.query('SELECT status FROM books WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const isAvailable = current.rows[0].status === 'Available';

        if (isAvailable) {
            const today = new Date().toISOString().split('T')[0];
            const defaultDue = new Date();
            defaultDue.setDate(defaultDue.getDate() + 14);
            const dueDate = due_date || defaultDue.toISOString().split('T')[0];

            const query = 'UPDATE books SET status = $1, borrower = $2, issue_date = $3, due_date = $4 WHERE id = $5 RETURNING *';
            const result = await pool.query(query, ['Issued', borrower || 'Student', today, dueDate, id]);
            res.json(result.rows[0]);
        } else {
            const query = 'UPDATE books SET status = $1, borrower = NULL, issue_date = NULL, due_date = NULL WHERE id = $2 RETURNING *';
            const result = await pool.query(query, ['Available', id]);
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
