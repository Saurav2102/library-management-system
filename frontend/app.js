const API = '/api/books';

let books = [];
let currentFilter = 'all';
let currentIssueId = null;

const booksTable = document.getElementById('booksTable');
const booksBody = document.getElementById('booksBody');
const emptyState = document.getElementById('emptyState');

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

const totalBooksEl = document.getElementById('totalBooks');
const availableBooksEl = document.getElementById('availableBooks');
const issuedBooksEl = document.getElementById('issuedBooks');
const overdueBooksEl = document.getElementById('overdueBooks');

const allCount = document.getElementById('allCount');
const availCount = document.getElementById('availCount');
const issueCount = document.getElementById('issueCount');
const overdueCount = document.getElementById('overdueCount');

const addModal = document.getElementById('addModal');
const openAddBtn = document.getElementById('openAddBtn');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const addBookForm = document.getElementById('addBookForm');

const issueModal = document.getElementById('issueModal');
const closeIssueModal = document.getElementById('closeIssueModal');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');
const confirmIssueBtn = document.getElementById('confirmIssueBtn');
const issueBookTitle = document.getElementById('issueBookTitle');
const borrowerName = document.getElementById('borrowerName');
const dueDateInput = document.getElementById('dueDateInput');

async function getBooks() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error('Failed to load books');
        books = await res.json();
        updateUI();
    } catch (err) {
        showToast('Error loading books');
    }
}

function updateUI() {
    updateCounters();
    const list = getFilteredList();

    if (list.length === 0) {
        booksTable.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        booksTable.style.display = 'table';
        emptyState.style.display = 'none';
        renderRows(list);
    }
}

function updateCounters() {
    const today = new Date().toISOString().split('T')[0];
    const total = books.length;
    const avail = books.filter(b => b.status === 'Available').length;
    const issued = books.filter(b => b.status === 'Issued').length;
    const overdue = books.filter(b => b.status === 'Issued' && b.due_date && b.due_date.split('T')[0] < today).length;

    totalBooksEl.textContent = total;
    availableBooksEl.textContent = avail;
    issuedBooksEl.textContent = issued;
    overdueBooksEl.textContent = overdue;

    allCount.textContent = total;
    availCount.textContent = avail;
    issueCount.textContent = issued;
    overdueCount.textContent = overdue;
}

function getFilteredList() {
    const today = new Date().toISOString().split('T')[0];
    const text = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter.value;

    return books.filter(book => {
        if (currentFilter === 'available' && book.status !== 'Available') return false;
        if (currentFilter === 'issued' && book.status !== 'Issued') return false;
        if (currentFilter === 'overdue') {
            const isOverdue = book.status === 'Issued' && book.due_date && book.due_date.split('T')[0] < today;
            if (!isOverdue) return false;
        }

        if (cat && book.category !== cat) return false;

        if (text) {
            const inTitle = book.title.toLowerCase().includes(text);
            const inAuthor = book.author.toLowerCase().includes(text);
            const inIsbn = book.isbn.toLowerCase().includes(text);
            if (!inTitle && !inAuthor && !inIsbn) return false;
        }

        return true;
    });
}

function renderRows(list) {
    const today = new Date().toISOString().split('T')[0];

    booksBody.innerHTML = list.map(b => {
        const isOverdue = b.status === 'Issued' && b.due_date && b.due_date.split('T')[0] < today;

        return `
        <tr>
            <td>${b.id}</td>
            <td>
                <div class="book-title">${escapeStr(b.title)}</div>
                <div class="book-author">${escapeStr(b.author)}</div>
            </td>
            <td><span class="isbn-tag">${escapeStr(b.isbn)}</span></td>
            <td><span class="category-tag">${escapeStr(b.category)}</span></td>
            <td>
                <span class="badge ${b.status === 'Available' ? 'available' : 'issued'}">
                    ${b.status}
                </span>
            </td>
            <td>${b.borrower ? escapeStr(b.borrower) : '-'}</td>
            <td>${formatDate(b.issue_date)}</td>
            <td class="${isOverdue ? 'overdue-date' : ''}">
                ${formatDate(b.due_date)} ${isOverdue ? '(Overdue)' : ''}
            </td>
            <td>
                <div class="actions">
                    <button class="btn-sm ${b.status === 'Available' ? 'issue' : 'return'}"
                        onclick="toggleBook(${b.id}, '${b.status}', '${escapeStr(b.title)}')">
                        ${b.status === 'Available' ? 'Issue' : 'Return'}
                    </button>
                    <button class="btn-sm delete" onclick="deleteBook(${b.id}, '${escapeStr(b.title)}')">
                        Delete
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

openAddBtn.addEventListener('click', () => {
    addBookForm.reset();
    addModal.classList.add('active');
});

closeAddModal.addEventListener('click', () => addModal.classList.remove('active'));
cancelAddBtn.addEventListener('click', () => addModal.classList.remove('active'));

addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const book = {
        title: document.getElementById('title').value.trim(),
        author: document.getElementById('author').value.trim(),
        isbn: document.getElementById('isbn').value.trim(),
        category: document.getElementById('category').value
    };

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(book)
        });

        const data = await res.json();
        if (!res.ok) {
            showToast(data.error || 'Failed to add');
            return;
        }

        showToast('Book added successfully');
        addModal.classList.remove('active');
        getBooks();
    } catch (err) {
        showToast('Server error');
    }
});

function toggleBook(id, status, title) {
    if (status === 'Available') {
        currentIssueId = id;
        issueBookTitle.textContent = title;
        borrowerName.value = '';

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 14);
        dueDateInput.value = defaultDate.toISOString().split('T')[0];

        issueModal.classList.add('active');
    } else {
        returnBook(id);
    }
}

closeIssueModal.addEventListener('click', () => issueModal.classList.remove('active'));
cancelIssueBtn.addEventListener('click', () => issueModal.classList.remove('active'));

confirmIssueBtn.addEventListener('click', async () => {
    if (!currentIssueId) return;

    const borrower = borrowerName.value.trim() || 'Student';
    const dueDate = dueDateInput.value;

    try {
        const res = await fetch(`${API}/${currentIssueId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borrower, due_date: dueDate })
        });

        if (!res.ok) throw new Error();

        showToast('Book issued');
        issueModal.classList.remove('active');
        getBooks();
    } catch (err) {
        showToast('Failed to issue book');
    }
});

async function returnBook(id) {
    try {
        const res = await fetch(`${API}/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!res.ok) throw new Error();

        showToast('Book returned');
        getBooks();
    } catch (err) {
        showToast('Failed to return book');
    }
}

async function deleteBook(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();

        showToast('Book deleted');
        getBooks();
    } catch (err) {
        showToast('Failed to delete book');
    }
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.tab;
        updateUI();
    });
});

searchInput.addEventListener('input', updateUI);
categoryFilter.addEventListener('change', updateUI);

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeStr(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(str) {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString();
}

window.addEventListener('DOMContentLoaded', getBooks);
