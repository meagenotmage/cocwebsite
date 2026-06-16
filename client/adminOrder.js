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

    // Helpers
    function isCashPayment(method) { return (method || '').toUpperCase() === 'CASH'; }
    function isGcashPayment(method) { return (method || '').toUpperCase() === 'GCASH'; }

    // ======================= //
    //    SETTINGS LOGIC       //
    // ======================= //
    async function loadPaymentSettings() {
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/settings/payment`);
            if (res.ok) {
                const data = await res.json();
                toggleGcash.checked = data.gcashEnabled;
                toggleCash.checked = data.cashEnabled;
            }
        } catch (e) { console.error('Settings load error', e); }
    }

    async function savePaymentSettings() {
        try {
            await fetch(`${CONFIG.API_URL}/api/settings/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gcashEnabled: toggleGcash.checked, cashEnabled: toggleCash.checked })
            });
        } catch (e) { console.error('Settings save error', e); }
    }

    toggleGcash.addEventListener('change', savePaymentSettings);
    toggleCash.addEventListener('change', savePaymentSettings);

    // ======================= //
    //    DATA LOADING         //
    // ======================= //
    async function loadOrders() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/orders`, { credentials: 'include' });
            if (response.ok) {
                allOrders = await response.json();
                populateSectionFilter(allOrders);
                displayOrders(allOrders);
            } else {
                ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Failed to load orders</td></tr>';
            }
        } catch (error) {
            console.error('Fetch error:', error);
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Connection error.</td></tr>';
        }
    }

    function populateSectionFilter(orders) {
        const sections = [...new Set(orders.map(o => o.programYear))].sort();
        filterSection.innerHTML = '<option value="">All Sections</option>';
        sections.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            filterSection.appendChild(opt);
        });
    }

    // ======================= //
    //    DISPLAY LOGIC        //
    // ======================= //
    function displayOrders(orders) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No orders yet</td></tr>';
            return;
        }

        const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        ordersTbody.innerHTML = '';

        sorted.forEach((order) => {
            const orderNum = String(order.orderNumber).padStart(4, '0');
            const time = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';

            let pClass = order.paymentStatus === 'paid' ? 'status-paid' : 'status-not-paid';
            let pText = order.paymentStatus === 'paid' ? 'Paid' : 'Not Paid';
            let dClass = order.status === 'received' ? 'status-received' : 'status-not-received';
            let dText = order.status === 'received' ? 'Received' : 'Not Received';

            const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
            const receiptClass = hasReceipt ? 'has-receipt' : 'no-receipt';

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
                <td>${orderNum}</td>
                <td class="timestamp">${time}</td>
                <td class="payment-status-cell"><span class="${pClass}">${pText}</span></td>
                <td class="delivery-status-cell"><span class="${dClass}">${dText}</span></td>
                <td>
                    <div class="actions">
                        <i class="fa-solid fa-chevron-down toggle-details"></i>
                        <i class="fa-solid fa-image view-receipt ${receiptClass}" data-order-id="${order._id}"></i>
                        <i class="fa-solid fa-trash delete-order"></i>
                    </div>
                </td>`;

            let itemsHTML = (order.items || []).map(i => `
                <tr>
                    <td>${i.customName || order.fullName}</td>
                    <td>${i.name}${i.size ? ' - ' + i.size : ''}</td>
                    <td>${i.quantity}</td>
                    <td>P ${i.price.toFixed(2)}</td>
                </tr>`).join('');

            const detailsRow = document.createElement('tr');
            detailsRow.className = 'order-details';
            detailsRow.innerHTML = `<td colspan="9">
                <table class="details-table">
                    <thead><tr><th>Name</th><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
            </td>`;

            ordersTbody.appendChild(summaryRow);
            ordersTbody.appendChild(detailsRow);
        });
    }

    // ======================= //
    //    ORDER ACTIONS (Main) //
    // ======================= //
    ordersTbody.addEventListener('click', async (e) => {
        const orderId = e.target.closest('tr')?.dataset.orderId;
        
        // 1. Toggle Details
        if (e.target.classList.contains('toggle-details')) {
            e.target.classList.toggle('is-open');
            e.target.closest('tr').nextElementSibling.classList.toggle('is-open');
        }

        // 2. Receipt Management Modal
        const icon = e.target.closest('.view-receipt');
        if (icon) {
            const order = allOrders.find(o => o._id === icon.dataset.orderId);
            if (!order) return;

            const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
            const modal = document.createElement('div');
            modal.className = 'receipt-modal management-modal';
            
            modal.innerHTML = `
                <div class="receipt-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>Receipt Management</h3>
                    <div class="modal-body">
                        ${hasReceipt ? `<img class="preview-img-small" src="${order.receiptUrl.startsWith('data') ? order.receiptUrl : CONFIG.API_URL + order.receiptUrl}">` : `<p>No receipt on file</p>`}
                        <div class="modal-actions">
                            <hr>
                            <input type="file" id="modal-file-input" accept="image/*">
                            <button class="btn-save-receipt" style="background:#2196F3; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; width:100%;">Save to Database</button>
                            ${order.status === 'pending_payment' ? `<div class="verify-zone" style="display:flex; gap:10px; margin-top:15px;"><button class="v-btn" style="background:#4CAF50; color:white; flex:1; border:none; padding:10px; border-radius:6px;">Approve</button><button class="r-btn" style="background:#f44336; color:white; flex:1; border:none; padding:10px; border-radius:6px;">Reject</button></div>` : ''}
                        </div>
                    </div>
                </div>`;

            document.body.appendChild(modal);

            modal.querySelector('.close-modal').onclick = () => modal.remove();
            
            // THE BASE64 SAVE LOGIC
            modal.querySelector('.btn-save-receipt').onclick = async function() {
                const fileInput = modal.querySelector('#modal-file-input');
                const file = fileInput.files[0];
                if (!file) return alert('Select file');

                this.disabled = true;
                this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    try {
                        const res = await fetch(`${CONFIG.API_URL}/api/orders/${order._id}/receipt-base64`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ receiptUrl: reader.result })
                        });
                        if (res.ok) { alert('Saved permanently!'); modal.remove(); loadOrders(); }
                    } catch (err) { console.error(err); this.disabled = false; }
                };
            };

            const v = modal.querySelector('.v-btn');
            if(v) v.onclick = () => updatePayment(order._id, 'paid', 'paid', modal);
            const r = modal.querySelector('.r-btn');
            if(r) r.onclick = () => updatePayment(order._id, 'pending_payment', 'pending', modal);
        }

        // 3. Delete Logic
        if (e.target.classList.contains('delete-order')) {
            if (confirm("Mark for deletion?")) {
                await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/mark-for-deletion`, { method: 'POST', credentials: 'include' });
                loadOrders();
            }
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

    // ======================= //
    //    FILTERS & EDITING    //
    // ======================= //
    function applyFilters() {
        const search = searchInput.value.toLowerCase().trim();
        const payF = filterPayment.value.toLowerCase();
        const secF = filterSection.value;
        const rows = ordersTbody.querySelectorAll('.order-summary');

        rows.forEach(row => {
            const name = row.dataset.name.toLowerCase();
            const pay = row.dataset.payment.toLowerCase();
            const sec = row.dataset.section;
            const matches = (!search || name.includes(search) || pay.includes(search)) && 
                            (!payF || pay === payF) && (!secF || sec === secF);
            row.style.display = matches ? '' : 'none';
            row.nextElementSibling.style.display = row.style.display;
        });
    }
    searchInput.addEventListener('keyup', applyFilters);
    filterPayment.addEventListener('change', applyFilters);
    filterSection.addEventListener('change', applyFilters);

    ordersTbody.addEventListener('click', async (e) => {
        const td = e.target.closest('td');
        if (!td || !td.closest('.order-summary')) return;
        const isP = td.cellIndex === 6; const isD = td.cellIndex === 7;
        if ((isP || isD) && !td.querySelector('select')) {
            const select = document.createElement('select');
            const opts = isP ? ['Paid', 'Pending'] : ['Received', 'Not Received'];
            opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; select.appendChild(op); });
            td.innerHTML = ''; td.appendChild(select); select.focus();
            select.onchange = async () => {
                const id = td.closest('.order-summary').dataset.orderId;
                const body = isP ? { paymentStatus: select.value.toLowerCase() } : { status: select.value.toLowerCase() === 'received' ? 'received' : 'paid' };
                await fetch(`${CONFIG.API_URL}/api/orders/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify(body) });
                loadOrders();
            };
        }
    });

    // Initialize
    loadPaymentSettings();
    loadOrders();
});