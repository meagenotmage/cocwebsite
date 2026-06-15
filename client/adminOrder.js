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
    function displayOrders(orders) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
            return;
        }

        const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        ordersTbody.innerHTML = '';

        sortedOrders.forEach((order) => {
            const orderNumber = String(order.orderNumber).padStart(4, '0');

            // 1. Timestamp
            let timestamp = 'N/A';
            if (order.createdAt) {
                timestamp = new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                });
            }

            // 2. Deletion logic
            let deletionWarningHTML = ''; 
            if (order.markedForDeletion && order.deletionWarningDate) {
                const deleteDate = new Date(order.deletionWarningDate);
                deleteDate.setDate(deleteDate.getDate() + 7);
                const daysUntilDeletion = Math.ceil((deleteDate - new Date()) / (1000 * 60 * 60 * 24));
                const warningClass = daysUntilDeletion <= 0 ? 'deletion-ready' : 'deletion-warning';
                deletionWarningHTML = `<span class="deletion-badge ${warningClass}" title="Marked for deletion">🗑️ ${Math.max(0, daysUntilDeletion)}d</span>`;
            }

            // 3. Payment Status
            let pClass, pText;
            if (order.paymentStatus === 'paid') { pClass = 'status-paid'; pText = 'Paid'; }
            else if (order.paymentStatus === 'pending') { pClass = 'status-pending'; pText = 'Pending'; }
            else { pClass = 'status-not-paid'; pText = 'Not Paid'; }

            // 4. Delivery Status
            let dText = order.status === 'received' ? 'Received' : 'Not Received';
            let dClass = order.status === 'received' ? 'status-received' : 'status-not-received';

            // 5. Receipt Logic
            const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
            const receiptClass = hasReceipt ? 'has-receipt' : 'no-receipt';
            const receiptTitle = hasReceipt ? 'View Receipt' : 'No Receipt Uploaded';

            let receiptManagementHTML = '';
            if (hasReceipt) {
                receiptManagementHTML = `
                    <div class="admin-management-box receipt-exists">
                        <h4><i class="fa-solid fa-circle-check"></i> Payment Proof on File</h4>
                        <div class="upload-controls">
                            <button class="view-receipt btn-secondary" data-order-id="${order._id}"><i class="fa-solid fa-eye"></i> View Current</button>
                            <button class="btn-show-replace" onclick="this.nextElementSibling.style.display='flex'; this.style.display='none'"><i class="fa-solid fa-pen"></i> Replace</button>
                            <div class="replace-controls" style="display: none; gap: 10px; align-items: center;">
                                <input type="file" class="admin-manual-upload-input" accept="image/*">
                                <button class="btn-manual-upload" data-order-id="${order._id}">Confirm</button>
                            </div>
                        </div>
                        ${order.status === 'pending_payment' ? `
                            <div class="receipt-verification" style="margin-top:10px; border-top:1px solid #ddd; padding-top:10px;">
                                <button class="verify-btn" data-order-id="${order._id}"><i class="fa-solid fa-check"></i> Approve GCash</button>
                                <button class="reject-btn" data-order-id="${order._id}"><i class="fa-solid fa-x"></i> Reject</button>
                            </div>` : ''}
                    </div>`;
            } else {
                receiptManagementHTML = `
                    <div class="admin-management-box no-receipt">
                        <h4><i class="fa-solid fa-circle-exclamation"></i> No Receipt Found</h4>
                        <div class="upload-controls">
                            <input type="file" class="admin-manual-upload-input" accept="image/*">
                            <button class="btn-manual-upload" data-order-id="${order._id}"><i class="fa-solid fa-upload"></i> Upload & Save</button>
                        </div>
                    </div>`;
            }

            // 6. Items Table
            let itemsHTML = (order.items || []).map(item => `
                <tr>
                    <td>${item.customName || order.fullName}</td>
                    <td>${item.name}${item.size ? ' - ' + item.size : ''}</td>
                    <td>${item.quantity}</td>
                    <td>P ${item.price.toFixed(2)}</td>
                </tr>`).join('');

            // 7. Summary Row
            const summaryRow = document.createElement('tr');
            summaryRow.className = `order-summary ${order.markedForDeletion ? 'marked-for-deletion' : ''}`;
            summaryRow.dataset.orderId = order._id;
            summaryRow.dataset.name = order.fullName;
            summaryRow.dataset.payment = order.paymentMethod;
            summaryRow.dataset.section = order.programYear;

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
                        ${deletionWarningHTML}
                        <i class="fa-solid fa-chevron-down toggle-details"></i>
                        <i class="fa-solid fa-image view-receipt ${receiptClass}" title="${receiptTitle}" data-order-id="${order._id}"></i>
                        ${order.markedForDeletion ? 
                            `<i class="fa-solid fa-undo cancel-deletion" data-order-id="${order._id}"></i>` : 
                            `<i class="fa-solid fa-trash delete-order" data-order-id="${order._id}"></i>`}
                    </div>
                </td>`;

            const detailsRow = document.createElement('tr');
            detailsRow.className = 'order-details';
            detailsRow.innerHTML = `<td colspan="9">
                ${receiptManagementHTML}
                <table class="details-table">
                    <thead><tr><th>Name</th><th>Product</th><th>Quantity</th><th>Price</th></tr></thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
            </td>`;

            ordersTbody.appendChild(summaryRow);
            ordersTbody.appendChild(detailsRow);
        });
    }

    loadOrders();

    // ======================= //
    //    EVENT LISTENERS      //
    // ======================= //

    // 1. Dropdown Toggle
    ordersTbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-details')) {
            e.target.classList.toggle('is-open');
            e.target.closest('tr').nextElementSibling.classList.toggle('is-open');
        }
    });

    // 2. Filters
    function applyFilters() {
        const searchQuery = searchInput.value.toLowerCase().trim();
        const paymentFilter = filterPayment.value.toLowerCase();
        const sectionFilter = filterSection.value;
        const rows = ordersTbody.querySelectorAll('.order-summary');

        rows.forEach(row => {
            const name = (row.dataset.name || "").toLowerCase();
            const payment = (row.dataset.payment || "").toLowerCase();
            const section = (row.dataset.section || "");
            
            const matchesSearch = !searchQuery || name.includes(searchQuery) || payment.includes(searchQuery) || section.toLowerCase().includes(searchQuery);
            const matchesPayment = !paymentFilter || payment === paymentFilter;
            const matchesSection = !sectionFilter || section === sectionFilter;
            
            row.style.display = (matchesSearch && matchesPayment && matchesSection) ? '' : 'none';
            if (row.nextElementSibling) row.nextElementSibling.style.display = row.style.display;
        });
    }
    searchInput.addEventListener('keyup', applyFilters);
    filterPayment.addEventListener('change', applyFilters);
    filterSection.addEventListener('change', applyFilters);

    // 3. Inline Editing
    ordersTbody.addEventListener('click', async (e) => {
        const target = e.target.closest('td');
        if (!target || !target.closest('.order-summary')) return;

        const isPayment = target.cellIndex === 6;
        const isDelivery = target.cellIndex === 7;

        if ((isPayment || isDelivery) && !target.querySelector('select')) {
            const current = target.querySelector('span')?.textContent.trim() || target.textContent.trim();
            const options = isPayment ? ['Paid', 'Pending', 'Not Paid'] : ['Received', 'Not Received'];
            
            const select = document.createElement('select');
            select.className = 'inline-status-select';
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt; o.textContent = opt; o.selected = (opt === current);
                select.appendChild(o);
            });

            target.innerHTML = ''; target.appendChild(select); select.focus();

            const save = async () => {
                const val = select.value;
                const id = target.closest('.order-summary').dataset.orderId;
                let body = {};
                if (isPayment) body.paymentStatus = (val === 'Paid' ? 'paid' : 'pending');
                else body.status = (val === 'Received' ? 'received' : 'paid');

                try {
                    const res = await fetch(`${CONFIG.API_URL}/api/orders/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(body)
                    });
                    if (res.ok) loadOrders();
                } catch (err) { console.error(err); loadOrders(); }
            };
            select.addEventListener('change', save);
            select.addEventListener('blur', save);
        }
    });

    // 4. View Receipt
    ordersTbody.addEventListener('click', (e) => {
        const icon = e.target.closest('.view-receipt');
        if (!icon || icon.classList.contains('no-receipt')) return;

        const order = allOrders.find(o => o._id === icon.dataset.orderId);
        if (!order || !order.receiptUrl) return;

        const modal = document.createElement('div');
        modal.className = 'receipt-modal';
        modal.innerHTML = `
            <div class="receipt-modal-content">
                <span class="close-modal">&times;</span>
                <h3>Payment Receipt</h3>
                <div class="receipt-image-container">
                    <img class="receipt-image" src="${order.receiptUrl.startsWith('data') ? order.receiptUrl : CONFIG.API_URL + order.receiptUrl}">
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', (ev) => { if (ev.target.classList.contains('receipt-modal') || ev.target.classList.contains('close-modal')) modal.remove(); });
    });

    // 5. Manual Admin Upload
    ordersTbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-manual-upload');
        if (!btn) return;

        const container = btn.closest('.admin-management-box');
        const file = container.querySelector('.admin-manual-upload-input').files[0];
        if (!file) return alert('Select a file.');

        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/orders/${btn.dataset.orderId}/receipt`, {
                method: 'POST', credentials: 'include', body: formData
            });
            if (res.ok) loadOrders();
        } catch (err) { console.error(err); }
    });

    // 6. GCash Verify/Reject
    ordersTbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.verify-btn') || e.target.closest('.reject-btn');
        if (!btn) return;
        const isVerify = btn.classList.contains('verify-btn');
        if (!confirm(`Are you sure you want to ${isVerify ? 'approve' : 'reject'}?`)) return;

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/orders/${btn.dataset.orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paymentStatus: isVerify ? 'paid' : 'pending', status: isVerify ? 'paid' : 'pending_payment' })
            });
            if (res.ok) loadOrders();
        } catch (err) { console.error(err); }
    });

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