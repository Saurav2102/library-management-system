# Library Management System

A full-stack web application for managing library books, tracking borrowings, and managing due dates.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: PostgreSQL

## Project Structure
```
DBMS/
├── database/
│   └── schema.sql
├── backend/
│   ├── .env
│   ├── package.json
│   ├── db.js
│   └── server.js
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## Setup Instructions

### 1. Database Setup (pgAdmin 4)
1. Open pgAdmin 4.
2. Create a new database called `library_db`.
3. Open the Query Tool for `library_db`.
4. Copy the SQL commands from `database/schema.sql` and run them.

### 2. Configure Environment
In `backend/.env`, set your PostgreSQL password:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=library_db
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000
```

### 3. Run the Application
Open a terminal inside the project:
```bash
cd backend
npm install
npm start
```

Open your browser and visit: `http://localhost:3000`

## Features
- View all books with live status and due dates
- Add new books to the database
- Issue books to borrowers with a 14-day due date
- Return issued books
- Delete books from the database
- Search by title, author, or ISBN
- Filter by category and status (All, Available, Issued, Overdue)
