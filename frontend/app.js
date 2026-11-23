const API = '/api/books';

let books = [];
let activeStatusFilter = 'all';
let viewMode = 'table';
let pendingIssueBook = null;

// DOM Elements
const booksTableBody = document.getElementById('booksTableBody');
const booksCardsGrid = document.getElementById('booksCardsGrid');
const tableViewWrap = document.getElementById('tableViewWrap');
const gridViewWrap = document.getElementById('gridViewWrap');
const emptyState = document.getElementById('emptyState');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const categoryPillsList = document.getElementById('categoryPillsList');

// Metrics
const metricTotal = document.getElementById('metricTotal');
const metricAvailable = document.getElementById('metricAvailable');
const metricIssued = document.getElementById('metricIssued');
const metricOverdue = document.getElementById('metricOverdue');
const metricCategoriesCount = document.getElementById('metricCategoriesCount');
const metricAvailRate = document.getElementById('metricAvailRate');
const metricFines = document.getElementById('metricFines');

// Badges
const badgeAll = document.getElementById('badgeAll');
const badgeAvailable = document.getElementById('badgeAvailable');
const badgeIssued = document.getElementById('badgeIssued');
const badgeOverdue = document.getElementById('badgeOverdue');
const footerCountText = document.getElementById('footerCountText');

// Modals
const addBookModal = document.getElementById('addBookModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const addBookForm = document.getElementById('addBookForm');

const editBookModal = document.getElementById('editBookModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editBookForm = document.getElementById('editBookForm');

const issueBookModal = document.getElementById('issueBookModal');
const closeIssueModal = document.getElementById('closeIssueModal');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');
const confirmIssueBtn = document.getElementById('confirmIssueBtn');
const issueTargetBookTitle = document.getElementById('issueTargetBookTitle');
const borrowerNameInput = document.getElementById('borrowerName');
const borrowerIdInput = document.getElementById('borrowerId');
const dueDateInput = document.getElementById('dueDateInput');
const presetPills = document.querySelectorAll('.preset-pill');

// Actions
const exportCsvBtn = document.getElementById('exportCsvBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const viewTableBtn = document.getElementById('viewTableBtn');
const viewGridBtn = document.getElementById('viewGridBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// ─────────────────────────────────────────────
// FETCH DATA
// ─────────────────────────────────────────────

async function loadData() {
    try {
        const queryParams = new URLSearchParams();
        if (searchInput.value.trim()) queryParams.append('search', searchInput.value.trim());
        if (categorySelect.value) queryParams.append('category', categorySelect.value);
        if (activeStatusFilter !== 'all') queryParams.append('status', activeStatusFilter);
        if (sortSelect.value !== 'default') queryParams.append('sort', sortSelect.value);

        const [booksRes, statsRes] = await Promise.all([
            fetch(`${API}?${queryParams.toString()}`),
            fetch('/api/stats')
        ]);

        if (!booksRes.ok) throw new Error('Books fetch failed');
        books = await booksRes.json();

        if (statsRes.ok) {
            const stats = await statsRes.json();
            updateMetrics(stats);
        }

        renderView();
    } catch (err) {
        showToast('Error connecting to database', 'error');
        console.error(err);
    }
}

function updateMetrics(stats) {
    const m = stats.metrics;
    const total = parseInt(m.total) || 0;
    const avail = parseInt(m.available) || 0;
    const issued = parseInt(m.issued) || 0;
    const overdue = parseInt(m.overdue) || 0;
    const fines = parseFloat(m.total_fines) || 0;

    metricTotal.textContent = total;
    metricAvailable.textContent = avail;
    metricIssued.textContent = issued;
    metricOverdue.textContent = overdue;

    badgeAll.textContent = total;
    badgeAvailable.textContent = avail;
    badgeIssued.textContent = issued;
    badgeOverdue.textContent = overdue;

    metricCategoriesCount.textContent = `${stats.categories.length} Categories`;
    metricAvailRate.textContent = total > 0 ? `${Math.round((avail / total) * 100)}% of collection` : '0%';
    metricFines.textContent = `$${fines.toFixed(2)} in total fines`;

    renderCategoryPills(stats.categories);
}

function renderCategoryPills(categories) {
    categoryPillsList.innerHTML = `
        <button class="cat-pill ${!categorySelect.value ? 'active' : ''}" onclick="selectCategoryPill('')">
            All (${categories.reduce((acc, c) => acc + parseInt(c.count), 0)})
        </button>
        ${categories.map(c => `
            <button class="cat-pill ${categorySelect.value === c.category ? 'active' : ''}" onclick="selectCategoryPill('${escapeStr(c.category)}')">
                ${escapeStr(c.category)} (${c.count})
            </button>
        `).join('')}
    `;
}

function selectCategoryPill(category) {
    categorySelect.value = category;
    loadData();
}

// ─────────────────────────────────────────────
// RENDER VIEWS
// ─────────────────────────────────────────────

function renderView() {
    footerCountText.textContent = `Showing ${books.length} records`;

    if (books.length === 0) {
        tableViewWrap.style.display = 'none';
        gridViewWrap.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    if (viewMode === 'table') {
        tableViewWrap.style.display = 'block';
        gridViewWrap.style.display = 'none';
        renderTable();
    } else {
        tableViewWrap.style.display = 'none';
        gridViewWrap.style.display = 'block';
        renderGrid();
    }
}

function renderTable() {
    const today = new Date().toISOString().split('T')[0];

    booksTableBody.innerHTML = books.map((b, index) => {
        const isIssued = b.status === 'Issued';
        const isOverdue = isIssued && b.due_date && b.due_date.split('T')[0] < today;
        const initial = (b.title || 'B').charAt(0).toUpperCase();

        return `
        <tr>
            <td class="seq-num">#${index + 1}</td>
            <td>
                <div class="book-cell">
                    <div class="book-monogram">${initial}</div>
                    <div class="book-titles">
                        <span class="book-title-name">${escapeStr(b.title)}</span>
                        <span class="book-author-name">${escapeStr(b.author)}</span>
                    </div>
                </div>
            </td>
            <td><span class="isbn-badge">${escapeStr(b.isbn)}</span></td>
            <td><span class="category-tag">${escapeStr(b.category)}</span></td>
            <td>
                <span class="status-badge ${isIssued ? 'issued' : 'available'}">
                    <span class="dot"></span>
                    ${b.status}
                </span>
            </td>
            <td>
                ${b.borrower ? `
                    <div class="borrower-info">
                        <span class="borrower-name">${escapeStr(b.borrower)}</span>
                        ${b.borrower_id ? `<span class="borrower-id">${escapeStr(b.borrower_id)}</span>` : ''}
                    </div>
                ` : '<span style="color:var(--text-soft)">—</span>'}
            </td>
            <td>${formatDate(b.issue_date)}</td>
            <td>
                ${isIssued && b.due_date ? `
                    <div class="due-info">
                        <span class="due-date-text">${formatDate(b.due_date)}</span>
                        ${isOverdue ? `
                            <span class="due-alert-pill">⚠️ Overdue by ${b.overdue_days}d (Fine: $${b.fine_amount})</span>
                        ` : `
                            <span class="due-normal-pill">Due in ${getDaysRemaining(b.due_date)} days</span>
                        `}
                    </div>
                ` : '<span style="color:var(--text-soft)">—</span>'}
            </td>
            <td>
                <div class="action-buttons">
                    ${!isIssued ? `
                        <button class="btn-mini issue" onclick="openIssueModal(${b.id}, '${escapeStr(b.title)}')">Issue</button>
                    ` : `
                        <button class="btn-mini return" onclick="returnBook(${b.id}, '${escapeStr(b.title)}')">Return</button>
                        <button class="btn-mini renew" title="Extend loan by 7 days" onclick="renewBook(${b.id}, '${escapeStr(b.title)}')">+7d Renew</button>
                    `}
                    <button class="btn-mini" onclick="openEditModal(${b.id})">Edit</button>
                    <button class="btn-mini delete" onclick="deleteBook(${b.id}, '${escapeStr(b.title)}')">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderGrid() {
    const today = new Date().toISOString().split('T')[0];

    booksCardsGrid.innerHTML = books.map((b, index) => {
        const isIssued = b.status === 'Issued';
        const isOverdue = isIssued && b.due_date && b.due_date.split('T')[0] < today;

        return `
        <div class="book-card">
            <div>
                <div class="card-top">
                    <span class="category-tag">${escapeStr(b.category)}</span>
                    <span class="status-badge ${isIssued ? 'issued' : 'available'}">
                        <span class="dot"></span> ${b.status}
                    </span>
                </div>
                <div class="card-body" style="margin-top: 0.75rem;">
                    <h4>${escapeStr(b.title)}</h4>
                    <p class="card-author">${escapeStr(b.author)}</p>
                    <div class="card-meta-list">
                        <div class="card-meta-row">
                            <span>ISBN:</span> <span class="isbn-badge">${escapeStr(b.isbn)}</span>
                        </div>
                        <div class="card-meta-row">
                            <span>Catalog #:</span> <strong>#${index + 1}</strong>
                        </div>
                        ${isIssued ? `
                            <div class="card-meta-row">
                                <span>Borrower:</span> <strong>${escapeStr(b.borrower)}</strong>
                            </div>
                            <div class="card-meta-row">
                                <span>Due:</span> 
                                <span class="${isOverdue ? 'due-alert-pill' : ''}">
                                    ${formatDate(b.due_date)} ${isOverdue ? `(+$${b.fine_amount})` : ''}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                ${!isIssued ? `
                    <button class="btn-mini issue" style="flex:1;" onclick="openIssueModal(${b.id}, '${escapeStr(b.title)}')">Issue</button>
                ` : `
                    <button class="btn-mini return" style="flex:1;" onclick="returnBook(${b.id}, '${escapeStr(b.title)}')">Return</button>
                    <button class="btn-mini renew" onclick="renewBook(${b.id}, '${escapeStr(b.title)}')">+7d</button>
                `}
                <button class="btn-mini" onclick="openEditModal(${b.id})">Edit</button>
                <button class="btn-mini delete" onclick="deleteBook(${b.id}, '${escapeStr(b.title)}')">🗑</button>
            </div>
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// ADD BOOK
// ─────────────────────────────────────────────

openAddModalBtn.addEventListener('click', () => {
    addBookForm.reset();
    addBookModal.classList.add('active');
    document.getElementById('title').focus();
});

closeAddModal.addEventListener('click', () => addBookModal.classList.remove('active'));
cancelAddBtn.addEventListener('click', () => addBookModal.classList.remove('active'));

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
            showToast(data.error || 'Failed to add book', 'error');
            return;
        }

        showToast(`Added "${book.title}"`);
        addBookModal.classList.remove('active');
        loadData();
    } catch (err) {
        showToast('Server communication error', 'error');
    }
});

// ─────────────────────────────────────────────
// EDIT BOOK
// ─────────────────────────────────────────────

function openEditModal(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    document.getElementById('editBookId').value = book.id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editIsbn').value = book.isbn;
    document.getElementById('editCategory').value = book.category;

    editBookModal.classList.add('active');
}

closeEditModal.addEventListener('click', () => editBookModal.classList.remove('active'));
cancelEditBtn.addEventListener('click', () => editBookModal.classList.remove('active'));

editBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBookId').value;

    const book = {
        title: document.getElementById('editTitle').value.trim(),
        author: document.getElementById('editAuthor').value.trim(),
        isbn: document.getElementById('editIsbn').value.trim(),
        category: document.getElementById('editCategory').value
    };

    try {
        const res = await fetch(`${API}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(book)
        });

        const data = await res.json();
        if (!res.ok) {
            showToast(data.error || 'Update failed', 'error');
            return;
        }

        showToast(`Updated "${book.title}"`);
        editBookModal.classList.remove('active');
        loadData();
    } catch (err) {
        showToast('Server error', 'error');
    }
});

// ─────────────────────────────────────────────
// ISSUE / RETURN / RENEW
// ─────────────────────────────────────────────

function openIssueModal(id, title) {
    pendingIssueBook = id;
    issueTargetBookTitle.textContent = `Checkout for "${title}"`;
    borrowerNameInput.value = '';
    borrowerIdInput.value = '';

    setLoanDuration(14);
    issueBookModal.classList.add('active');
    borrowerNameInput.focus();
}

function setLoanDuration(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    dueDateInput.value = d.toISOString().split('T')[0];

    presetPills.forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.days) === days);
    });
}

presetPills.forEach(p => {
    p.addEventListener('click', () => setLoanDuration(parseInt(p.dataset.days)));
});

closeIssueModal.addEventListener('click', () => issueBookModal.classList.remove('active'));
cancelIssueBtn.addEventListener('click', () => issueBookModal.classList.remove('active'));

confirmIssueBtn.addEventListener('click', async () => {
    if (!pendingIssueBook) return;

    const borrower = borrowerNameInput.value.trim();
    if (!borrower) {
        showToast('Please enter borrower name', 'error');
        borrowerNameInput.focus();
        return;
    }

    const borrower_id = borrowerIdInput.value.trim();
    const due_date = dueDateInput.value;

    try {
        const res = await fetch(`${API}/${pendingIssueBook}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borrower, borrower_id, due_date })
        });

        if (!res.ok) throw new Error();

        showToast(`Book issued to ${borrower}`);
        issueBookModal.classList.remove('active');
        loadData();
    } catch (err) {
        showToast('Failed to issue book', 'error');
    }
});

async function returnBook(id, title) {
    try {
        const res = await fetch(`${API}/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!res.ok) throw new Error();

        showToast(`"${title}" returned to shelf`);
        loadData();
    } catch (err) {
        showToast('Return failed', 'error');
    }
}

async function renewBook(id, title) {
    try {
        const res = await fetch(`${API}/${id}/renew`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: 7 })
        });

        if (!res.ok) throw new Error();

        showToast(`Renewed "${title}" (+7 days)`);
        loadData();
    } catch (err) {
        showToast('Renewal failed', 'error');
    }
}

async function deleteBook(id, title) {
    if (!confirm(`Delete "${title}" from catalog?`)) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();

        showToast(`Deleted "${title}"`);
        loadData();
    } catch (err) {
        showToast('Delete failed', 'error');
    }
}

// ─────────────────────────────────────────────
// CONTROLS & FILTERING
// ─────────────────────────────────────────────

document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeStatusFilter = tab.dataset.status;
        loadData();
    });
});

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('visible', searchInput.value.trim().length > 0);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadData, 250);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.remove('visible');
    loadData();
});

categorySelect.addEventListener('change', loadData);
sortSelect.addEventListener('change', loadData);

resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = '';
    sortSelect.value = 'default';
    activeStatusFilter = 'all';
    document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.status === 'all'));
    loadData();
});

// View Toggle
viewTableBtn.addEventListener('click', () => {
    viewMode = 'table';
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    renderView();
});

viewGridBtn.addEventListener('click', () => {
    viewMode = 'grid';
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderView();
});

// CSV Export
exportCsvBtn.addEventListener('click', () => {
    window.location.href = '/api/export/csv';
    showToast('Exporting catalog CSV...');
});

// Dark Mode Toggle
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateThemeIcon(nextTheme);
});

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function showToast(msg, type = 'success') {
    const hub = document.getElementById('toastHub');
    const toast = document.createElement('div');
    toast.className = `toast-item ${type === 'error' ? 'error' : ''}`;
    toast.textContent = msg;

    hub.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 200);
    }, 2800);
}

function escapeStr(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(dueStr) {
    if (!dueStr) return 0;
    const diff = new Date(dueStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

window.addEventListener('DOMContentLoaded', loadData);
