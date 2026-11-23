const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connString = process.env.DATABASE_URL || 'postgresql://library_db_rrge_user:ReqD8jZk9NS4ZCieQ07BcyPgPvqBEvQr@dpg-dc1srhss728c73dbt2ag-a.oregon-postgres.render.com/library_db_rrge';

const pool = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
});

function parseCSVLine(text) {
    let result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(entry);
            entry = '';
        } else {
            entry += char;
        }
    }
    result.push(entry);
    return result;
}

async function seed() {
    const csvFile = path.join(__dirname, '..', 'database', 'real_library_dataset.csv');
    const content = fs.readFileSync(csvFile, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    console.log('Seeding real university books...');

    for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 5) continue;

        const [title, author, isbn, category, status, borrower, borrower_id, issue_date, due_date] = parts;

        await pool.query(`
            INSERT INTO books (title, author, isbn, category, status, borrower, borrower_id, issue_date, due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (isbn) DO UPDATE SET
                title = EXCLUDED.title,
                author = EXCLUDED.author,
                category = EXCLUDED.category,
                status = EXCLUDED.status,
                borrower = EXCLUDED.borrower,
                borrower_id = EXCLUDED.borrower_id,
                issue_date = EXCLUDED.issue_date,
                due_date = EXCLUDED.due_date;
        `, [
            title,
            author,
            isbn,
            category,
            status || 'Available',
            borrower || null,
            borrower_id || null,
            issue_date || null,
            due_date || null
        ]);
    }

    const countRes = await pool.query('SELECT COUNT(*) FROM books');
    console.log('Total books in PostgreSQL database:', countRes.rows[0].count);
    await pool.end();
}

seed().catch(err => {
    console.error('Seed error:', err);
    pool.end();
});
