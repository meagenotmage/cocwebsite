document.addEventListener('DOMContentLoaded', function () {
    // ======================= //
    //   MOBILE NAV TOGGLE     //
    // ======================= //
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebarNav = document.querySelector('.sidebar-nav');
    
    if (hamburgerBtn && sidebarNav) {
        hamburgerBtn.addEventListener('click', function() {
            sidebarNav.classList.toggle('active');
        });
    }

    const ordersTbody = document.getElementById('orders-tbody');
    const searchInput = document.getElementById('search-name');
    const filterPayment = document.getElementById('filter-payment');
    const filterSection = document.getElementById('filter-section');
    const filterItem = document.getElementById('filter-item');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const toggleGcash = document.getElementById('toggle-gcash');
    const toggleCash = document.getElementById('toggle-cash');
    let allOrders = [];

    function isCashPayment(method) {
        return (method || '').toUpperCase() === 'CASH';
    }

    function isGcashPayment(method) {
        return (method || '').toUpperCase() === 'GCASH';
    }

    // Load payment settings
    async function loadPaymentSettings() {
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/settings/payment`);
            if (res.ok) {
                const data = await res.json();
                toggleGcash.checked = data.gcashEnabled;
                toggleCash.checked = data.cashEnabled;
            }
        } catch (e) {
            console.error('Could not load payment settings', e);
        }
    }
    loadPaymentSettings();

    async function savePaymentSettings() {
        try {
            await fetch(`${CONFIG.API_URL}/api/settings/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gcashEnabled: toggleGcash.checked, cashEnabled: toggleCash.checked })
            });
        } catch (e) {
            console.error('Error saving payment settings', e);
        }
    }

    toggleGcash.addEventListener('change', savePaymentSettings);
    toggleCash.addEventListener('change', savePaymentSettings);

    // Load orders from API
    async function loadOrders() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/orders`, {
                credentials: 'include'
            });
            if (response.ok) {
                allOrders = await response.json();
                populateSectionFilter(allOrders);
                displayOrders(allOrders);
            } else {
                ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Failed to load orders</td></tr>';
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Error connecting to server.</td></tr>';
        }
    }

    function populateSectionFilter(orders) {
        const sections = [...new Set(orders.map(order => order.programYear))].sort();
        filterSection.innerHTML = '<option value="">All Sections</option>';
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            filterSection.appendChild(option);
        });
    }

    // ======================= //
    //    DISPLAY ORDERS       //
    // ======================= //
    // ======================= //

function displayOrders(orders) {
    if (orders.length === 0) {
        ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
        return;
    }

    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    ordersTbody.innerHTML = '';

    sortedOrders.forEach((order) => {
        const orderNumber = String(order.orderNumber).padStart(4, '0');
        const timestamp = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';

        // Payment & Delivery Badges
        let pClass = order.paymentStatus === 'paid' ? 'status-paid' : 'status-not-paid';
        let pText = order.paymentStatus === 'paid' ? 'Paid' : 'Not Paid';
        let dClass = order.status === 'received' ? 'status-received' : 'status-not-received';
        let dText = order.status === 'received' ? 'Received' : 'Not Received';

        // Receipt Icon Class
        const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
        const receiptClass = hasReceipt ? 'has-receipt' : 'no-receipt';

        // Items HTML
        let itemsHTML = (order.items || []).map(item => `
            <tr>
                <td>${item.customName || order.fullName}</td>
                <td>${item.name}${item.size ? ' - ' + item.size : ''}</td>
                <td>${item.quantity}</td>
                <td>P ${item.price.toFixed(2)}</td>
            </tr>`).join('');

        const summaryRow = document.createElement('tr');
        summaryRow.className = `order-summary ${order.markedForDeletion ? 'marked-for-deletion' : ''}`;
        summaryRow.dataset.orderId = order._id;

        summaryRow.innerHTML = `
            <td>${order.fullName}</td>
            <td>${order.programYear}</td>
            <td>${order.paymentMethod}</td>
            <td>P ${order.total.toFixed(2)}</td>
            <td>${orderNumber}</td>
            <td class="timestamp">${timestamp}</td>
            <td class="payment-status-cell"><span class="${pClass}">${pText}</span></td>
            <td class="delivery-status-cell"><span class="${dClass}">${dText}</span></td>
            <td>
                <div class="actions">
                    <i class="fa-solid fa-chevron-down toggle-details"></i>
                    <i class="fa-solid fa-image view-receipt ${receiptClass}" data-order-id="${order._id}"></i>
                    <i class="fa-solid fa-trash delete-order" data-order-id="${order._id}"></i>
                </div>
            </td>`;

        const detailsRow = document.createElement('tr');
        detailsRow.className = 'order-details';
        detailsRow.innerHTML = `<td colspan="9">
            <table class="details-table">
                <thead><tr><th>Name</th><th>Product</th><th>Quantity</th><th>Price</th></tr></thead>
                <tbody>${itemsHTML}</tbody>
            </table>
        </td>`;

        ordersTbody.appendChild(summaryRow);
        ordersTbody.appendChild(detailsRow);
    });
}

// ======================= //
//    RECEIPT MANAGEMENT   //
// ======================= //
ordersTbody.addEventListener('click', (e) => {
    const icon = e.target.closest('.view-receipt');
    if (!icon) return;

    const orderId = icon.dataset.orderId;
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
    const modal = document.createElement('div');
    modal.className = 'receipt-modal management-modal';
    
    modal.innerHTML = `
        <div class="receipt-modal-content">
            <span class="close-modal">&times;</span>
            <h3>Receipt Management</h3>
            <div class="modal-body">
                ${hasReceipt ? 
                    `<img class="preview-img-small" src="${order.receiptUrl.startsWith('data') ? order.receiptUrl : CONFIG.API_URL + order.receiptUrl}">` : 
                    `<div class="no-receipt-placeholder"><i class="fa-solid fa-image-slash"></i><p>No receipt on file</p></div>`
                }
                <div class="modal-actions">
                    ${hasReceipt ? `<button class="btn-action view-full" data-url="${order.receiptUrl}">View Full Image</button>` : ''}
                    <hr>
                    <p style="font-size:0.8rem; color:#666;">${hasReceipt ? 'Replace Receipt:' : 'Upload Receipt:'}</p>
                    <input type="file" id="modal-file-input" accept="image/*">
                    <button class="btn-action upload-btn" data-id="${order._id}">Save to Database</button>
                    
                    ${order.status === 'pending_payment' ? `
                        <div class="verify-zone">
                            <button class="verify-btn" data-id="${order._id}">Approve GCash</button>
                            <button class="reject-btn" data-id="${order._id}">Reject</button>
                        </div>` : ''}
                </div>
            </div>
        </div>`;

    document.body.appendChild(modal);

    // Modal Events
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    
    // Full Image View
    const vf = modal.querySelector('.view-full');
    if(vf) vf.onclick = () => window.open(vf.dataset.url.startsWith('data') ? vf.dataset.url : CONFIG.API_URL + vf.dataset.url, '_blank');

    // THE FIX: Manual Admin Upload Logic inside Modal
    modal.querySelector('.upload-btn').onclick = async function() {
        const fileInput = modal.querySelector('#modal-file-input');
        const file = fileInput.files[0];

        if (!file) return alert('Please select an image file first.');

        this.disabled = true;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/receipt`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (res.ok) {
                alert('Receipt saved successfully!');
                modal.remove();
                loadOrders(); // Refresh the main table
            } else {
                alert('Failed to save image. Check server logs.');
                this.disabled = false;
                this.innerHTML = 'Save to Database';
            }
        } catch (err) {
            console.error('Upload Error:', err);
            this.disabled = false;
        }
    };

    // GCash Verify/Reject
    const vBtn = modal.querySelector('.verify-btn');
    const rBtn = modal.querySelector('.reject-btn');
    if(vBtn && rBtn) {
        vBtn.onclick = () => updatePayment(orderId, 'paid', 'paid', modal);
        rBtn.onclick = () => updatePayment(orderId, 'pending_payment', 'pending', modal);
    }
});

async function updatePayment(id, status, pStatus, modal) {
    const res = await fetch(`${CONFIG.API_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: status, paymentStatus: pStatus })
    });
    if (res.ok) { modal.remove(); loadOrders(); }
    }
    
    // 7. Delete/Mark Logic
    ordersTbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-order') || e.target.closest('.cancel-deletion');
        if (!btn) return;
        const id = btn.closest('.order-summary').dataset.orderId;
        const isDelete = btn.classList.contains('delete-order');
        const url = `${CONFIG.API_URL}/api/orders/${id}/${isDelete ? 'mark-for-deletion' : 'cancel-deletion'}`;

        if (confirm(`${isDelete ? 'Mark for deletion?' : 'Cancel deletion?'}`)) {
            try {
                const res = await fetch(url, { method: 'POST', credentials: 'include' });
                if (res.ok) loadOrders();
            } catch (err) { console.error(err); }
        }
    });

    // 8. Export Excel
    exportExcelBtn.addEventListener('click', function () {
        const visibleRows = Array.from(ordersTbody.querySelectorAll('.order-summary')).filter(r => r.style.display !== 'none');
        const visibleIds = new Set(visibleRows.map(r => r.dataset.orderId));
        const rows = [['Order #', 'Name', 'Program / Year & Section', 'Payment Method', 'Total', 'Time', 'Payment Status', 'Status']];

        [...allOrders].filter(o => visibleIds.has(o._id)).forEach(o => {
            rows.push([o.orderNumber, o.fullName, o.programYear, o.paymentMethod, o.total, o.createdAt, o.paymentStatus, o.status]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');
        XLSX.writeFile(wb, 'COCSC_Orders.xlsx');
    });
});