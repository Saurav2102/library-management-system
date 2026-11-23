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
                borrower_id VARCHAR(50) DEFAULT NULL,
                issue_date DATE DEFAULT NULL,
                due_date DATE DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            ALTER TABLE books ADD COLUMN IF NOT EXISTS borrower_id VARCHAR(50) DEFAULT NULL;
        `);

        const countRes = await pool.query('SELECT COUNT(*) FROM books');
        if (parseInt(countRes.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO books (title, author, isbn, category, status, borrower, borrower_id, issue_date, due_date) VALUES
                ('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', '978-0135957059', 'Technology', 'Available', NULL, NULL, NULL, NULL),
                ('Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 'Issued', 'Alice Johnson', 'STU-1001', '2026-11-10', '2026-11-20'),
                ('Design Patterns', 'Gang of Four', '978-0201633610', 'Technology', 'Available', NULL, NULL, NULL, NULL),
                ('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Academics', 'Available', NULL, NULL, NULL, NULL),
                ('Database System Concepts', 'Abraham Silberschatz', '978-0078022159', 'Academics', 'Issued', 'Bob Smith', 'STU-1002', '2026-11-15', '2026-11-29'),
                ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'Available', NULL, NULL, NULL, NULL),
                ('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 'Available', NULL, NULL, NULL, NULL),
                ('Sapiens', 'Yuval Noah Harari', '978-0062316097', 'Non-Fiction', 'Available', NULL, NULL, NULL, NULL),
                ('Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 'Issued', 'Charlie Davis', 'STU-1003', '2026-11-05', '2026-11-19'),
                ('The Art of War', 'Sun Tzu', '978-1599869773', 'Philosophy', 'Available', NULL, NULL, NULL, NULL);
            `);
        }
    } catch (err) {
        console.error('Database init error:', err.message);
    }
};
initTable();

app.get('/api/books', async (req, res) => {
    try {
        const { search, category, status, sort } = req.query;
        let conditions = [];
        let params = [];

        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            conditions.push(`(LOWER(title) LIKE $${params.length} OR LOWER(author) LIKE $${params.length} OR LOWER(isbn) LIKE $${params.length} OR LOWER(COALESCE(borrower, '')) LIKE $${params.length})`);
        }

        if (category) {
            params.push(category);
            conditions.push(`category = $${params.length}`);
        }

        if (status === 'Available') {
            conditions.push(`status = 'Available'`);
        } else if (status === 'Issued') {
            conditions.push(`status = 'Issued'`);
        } else if (status === 'Overdue') {
            conditions.push(`status = 'Issued' AND due_date IS NOT NULL AND due_date < CURRENT_DATE`);
        }

        let whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        let orderBy = 'ORDER BY id ASC';
        if (sort === 'title_asc') orderBy = 'ORDER BY title ASC';
        if (sort === 'title_desc') orderBy = 'ORDER BY title DESC';
        if (sort === 'newest') orderBy = 'ORDER BY id DESC';
        if (sort === 'due_soon') orderBy = 'ORDER BY (CASE WHEN due_date IS NULL THEN 1 ELSE 0 END), due_date ASC';

        const query = `
            SELECT 
                id, title, author, isbn, category, status, borrower, borrower_id, 
                issue_date, due_date, created_at,
                CASE 
                    WHEN status = 'Issued' AND due_date < CURRENT_DATE THEN (CURRENT_DATE - due_date)
                    ELSE 0 
                END AS overdue_days,
                CASE 
                    WHEN status = 'Issued' AND due_date < CURRENT_DATE THEN (CURRENT_DATE - due_date) * 1
                    ELSE 0 
                END AS fine_amount
            FROM books 
            ${whereClause} 
            ${orderBy}
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) AS total,
                COUNT(CASE WHEN status = 'Available' THEN 1 END) AS available,
                COUNT(CASE WHEN status = 'Issued' THEN 1 END) AS issued,
                COUNT(CASE WHEN status = 'Issued' AND due_date < CURRENT_DATE THEN 1 END) AS overdue,
                COALESCE(SUM(CASE WHEN status = 'Issued' AND due_date < CURRENT_DATE THEN (CURRENT_DATE - due_date) * 1 ELSE 0 END), 0) AS total_fines
            FROM books;
        `;

        const categoriesQuery = `
            SELECT category, COUNT(*) AS count
            FROM books
            GROUP BY category
            ORDER BY count DESC;
        `;

        const [statsResult, catResult] = await Promise.all([
            pool.query(statsQuery),
            pool.query(categoriesQuery)
        ]);

        res.json({
            metrics: statsResult.rows[0],
            categories: catResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const { title, author, isbn, category } = req.body;

        if (!title || !author || !isbn || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const query = 'INSERT INTO books (title, author, isbn, category) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [title.trim(), author.trim(), isbn.trim(), category]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A book with this ISBN already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, category } = req.body;

        if (!title || !author || !isbn || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const query = `
            UPDATE books 
            SET title = $1, author = $2, isbn = $3, category = $4 
            WHERE id = $5 
            RETURNING *
        `;
        const result = await pool.query(query, [title.trim(), author.trim(), isbn.trim(), category, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A book with this ISBN already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

app.patch('/api/books/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { borrower, borrower_id, due_date } = req.body;

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

            const query = `
                UPDATE books 
                SET status = 'Issued', borrower = $1, borrower_id = $2, issue_date = $3, due_date = $4 
                WHERE id = $5 
                RETURNING *
            `;
            const result = await pool.query(query, [borrower || 'Student', borrower_id || null, today, dueDate, id]);
            res.json(result.rows[0]);
        } else {
            const query = `
                UPDATE books 
                SET status = 'Available', borrower = NULL, borrower_id = NULL, issue_date = NULL, due_date = NULL 
                WHERE id = $1 
                RETURNING *
            `;
            const result = await pool.query(query, [id]);
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update book status' });
    }
});

app.patch('/api/books/:id/renew', async (req, res) => {
    try {
        const { id } = req.params;
        const days = parseInt(req.body.days) || 7;

        const current = await pool.query('SELECT status, due_date FROM books WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (current.rows[0].status !== 'Issued') {
            return res.status(400).json({ error: 'Only issued books can be renewed' });
        }

        const baseDate = current.rows[0].due_date ? new Date(current.rows[0].due_date) : new Date();
        baseDate.setDate(baseDate.getDate() + days);
        const newDueDate = baseDate.toISOString().split('T')[0];

        const query = 'UPDATE books SET due_date = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [newDueDate, id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to renew book' });
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

app.get('/api/export/csv', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, title, author, isbn, category, status, borrower, borrower_id, issue_date, due_date FROM books ORDER BY id ASC');
        
        let csv = 'ID,Title,Author,ISBN,Category,Status,Borrower,BorrowerID,IssueDate,DueDate\n';
        result.rows.forEach(r => {
            const clean = str => `"${(str || '').toString().replace(/"/g, '""')}"`;
            csv += `${r.id},${clean(r.title)},${clean(r.author)},${clean(r.isbn)},${clean(r.category)},${clean(r.status)},${clean(r.borrower)},${clean(r.borrower_id)},${clean(r.issue_date ? r.issue_date.toISOString().split('T')[0] : '')},${clean(r.due_date ? r.due_date.toISOString().split('T')[0] : '')}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="library_books_export.csv"');
        res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Export failed' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
