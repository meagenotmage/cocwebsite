const TYPE_LABELS = {
    feedback:    'Feedback',
    suggestion:  'Suggestions & Insights',
    partnership: 'Partnership & Collaboration'
};
const TYPE_BADGE_CLASS = {
    feedback:    'type-badge--feedback',
    suggestion:  'type-badge--suggestion',
    partnership: 'type-badge--partnership'
};

let allFeedback = [];
let currentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Mobile sidebar toggle
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (hamburgerBtn && sidebarNav) {
        hamburgerBtn.addEventListener('click', () => sidebarNav.classList.toggle('active'));
    }

    await loadFeedback();

    // Filter dropdowns
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-status').addEventListener('change', applyFilters);

    // Modal close
    document.getElementById('fb-modal-close').addEventListener('click', closeModal);
    document.getElementById('feedback-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('feedback-modal')) closeModal();
    });

    // Save notes
    document.getElementById('save-notes-btn').addEventListener('click', saveNotes);
});

async function loadFeedback() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/api/feedback`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        allFeedback = await res.json();
        applyFilters();
        updateUnreadBadge();
    } catch (err) {
        console.error('Error loading feedback:', err);
    }
}

function applyFilters() {
    const typeFilter   = document.getElementById('filter-type').value;
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = allFeedback.filter(fb => {
        const typeMatch   = !typeFilter   || fb.type === typeFilter;
        const statusMatch = !statusFilter || fb.status === statusFilter;
        return typeMatch && statusMatch;
    });

    displayFeedback(filtered);
}

function displayFeedback(items) {
    const tbody = document.getElementById('feedback-tbody');
    const emptyMsg = document.getElementById('feedback-empty');
    tbody.innerHTML = '';

    if (items.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    items.forEach(fb => {
        const tr = document.createElement('tr');
        if (fb.status === 'unread') tr.classList.add('is-unread');

        const date = new Date(fb.createdAt).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const typeBadgeClass = TYPE_BADGE_CLASS[fb.type] || '';
        const typeLabel      = TYPE_LABELS[fb.type] || fb.type;
        const preview        = fb.message.length > 80 ? fb.message.slice(0, 80) + '…' : fb.message;
        const sender         = fb.isAnonymous
            ? 'Anonymous'
            : [fb.senderName, fb.senderEmail].filter(Boolean).join(' · ') || 'Anonymous';
        const statusClass = fb.status === 'unread' ? 'status-label--unread' : 'status-label--read';
        const statusLabel = fb.status === 'unread' ? 'Unread' : 'Read';

        const toggleTitle = fb.status === 'unread' ? 'Mark as read' : 'Mark as unread';
        const toggleIcon  = fb.status === 'unread'
            ? '<i class="fa-solid fa-envelope-open"></i>'
            : '<i class="fa-solid fa-envelope"></i>';
        const toggleClass = fb.status === 'unread' ? 'action-btn--read' : 'action-btn--unread';

        tr.innerHTML = `
            <td>${date}</td>
            <td><span class="type-badge ${typeBadgeClass}">${typeLabel}</span></td>
            <td><span class="msg-preview">${escapeHtml(preview)}</span></td>
            <td>${escapeHtml(sender)}</td>
            <td><span class="status-label ${statusClass}">${statusLabel}</span></td>
            <td>
                <div class="row-actions">
                    <button class="action-btn action-btn--view" data-id="${fb._id}" title="View details"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-btn ${toggleClass}" data-id="${fb._id}" data-action="toggle-status" title="${toggleTitle}">${toggleIcon}</button>
                    <button class="action-btn action-btn--delete" data-id="${fb._id}" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;

        // View
        tr.querySelector('.action-btn--view').addEventListener('click', () => openModal(fb._id));

        // Toggle read/unread
        tr.querySelector('[data-action="toggle-status"]').addEventListener('click', () => {
            const newStatus = fb.status === 'unread' ? 'read' : 'unread';
            updateFeedback(fb._id, { status: newStatus });
        });

        // Delete
        tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteFeedback(fb._id));

        tbody.appendChild(tr);
    });
}

function updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    const count = allFeedback.filter(fb => fb.status === 'unread').length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

async function updateFeedback(id, data) {
    try {
        const res = await fetch(`${CONFIG.API_URL}/api/feedback/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Update failed');
        const { feedback } = await res.json();
        // Update local copy
        const idx = allFeedback.findIndex(fb => fb._id === id);
        if (idx > -1) allFeedback[idx] = feedback;
        applyFilters();
        updateUnreadBadge();
    } catch (err) {
        console.error('Error updating feedback:', err);
        alert('Failed to update. Please try again.');
    }
}

async function deleteFeedback(id) {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    try {
        const res = await fetch(`${CONFIG.API_URL}/api/feedback/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Delete failed');
        allFeedback = allFeedback.filter(fb => fb._id !== id);
        applyFilters();
        updateUnreadBadge();
        if (currentId === id) closeModal();
    } catch (err) {
        console.error('Error deleting feedback:', err);
        alert('Failed to delete. Please try again.');
    }
}

function openModal(id) {
    const fb = allFeedback.find(f => f._id === id);
    if (!fb) return;
    currentId = id;

    const date = new Date(fb.createdAt).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const typeBadgeClass = TYPE_BADGE_CLASS[fb.type] || '';
    const typeLabel      = TYPE_LABELS[fb.type] || fb.type;

    document.getElementById('modal-type-badge').textContent = typeLabel;
    document.getElementById('modal-type-badge').className = `type-badge ${typeBadgeClass}`;
    document.getElementById('modal-date').textContent = date;
    document.getElementById('modal-message').textContent = fb.message;

    if (fb.isAnonymous) {
        document.getElementById('modal-sender').textContent = 'Anonymous';
    } else {
        const name  = fb.senderName  ? `Name: ${fb.senderName}`   : '';
        const email = fb.senderEmail ? `Email: ${fb.senderEmail}` : '';
        document.getElementById('modal-sender').textContent =
            [name, email].filter(Boolean).join('\n') || 'Anonymous';
    }

    document.getElementById('modal-notes').value = fb.adminNotes || '';
    document.getElementById('notes-saved-msg').style.display = 'none';

    document.getElementById('feedback-modal').style.display = 'flex';

    // Mark as read automatically when opened (if unread)
    if (fb.status === 'unread') {
        updateFeedback(id, { status: 'read' });
    }
}

function closeModal() {
    document.getElementById('feedback-modal').style.display = 'none';
    currentId = null;
}

async function saveNotes() {
    if (!currentId) return;
    const notes = document.getElementById('modal-notes').value;
    const savedMsg = document.getElementById('notes-saved-msg');
    savedMsg.style.display = 'none';

    await updateFeedback(currentId, { adminNotes: notes });

    savedMsg.style.display = 'inline';
    setTimeout(() => { savedMsg.style.display = 'none'; }, 2500);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
