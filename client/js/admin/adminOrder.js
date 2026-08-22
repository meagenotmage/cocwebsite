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
    // MERCH AVAILABILITY LOGIC//
    // ======================= //
    const merchTogglesContainer = document.getElementById('merch-toggles-container');

    async function loadMerchSettings() {
        if (!merchTogglesContainer) return;
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/products`);
            if (res.ok) {
                const products = await res.json();
                renderMerchToggles(products);
            }
        } catch (e) {
            console.error('Merch settings load error', e);
        }
    }

    function renderMerchToggles(products) {
        if (!merchTogglesContainer) return;
        merchTogglesContainer.innerHTML = '';
        products.forEach(p => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'merch-toggle-item';
            
            const isSoldOut = p.soldOut === true;
            const badgeClass = isSoldOut ? 'sold-out' : 'in-stock';
            const badgeText = isSoldOut ? 'Sold Out' : 'Available';

            itemDiv.innerHTML = `
                <span class="merch-name"><strong>${p.name}</strong></span>
                <span class="merch-status-badge ${badgeClass}">${badgeText}</span>
                <label class="toggle-switch">
                    <input type="checkbox" class="merch-soldout-toggle" data-product-id="${p.productId}" ${isSoldOut ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;

            const checkbox = itemDiv.querySelector('.merch-soldout-toggle');
            checkbox.addEventListener('change', async (e) => {
                const soldOut = e.target.checked;
                await updateMerchSoldOut(p.productId, soldOut);
            });

            merchTogglesContainer.appendChild(itemDiv);
        });
    }

    async function updateMerchSoldOut(productId, soldOut) {
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/products/${productId}/sold-out`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ soldOut })
            });
            if (res.ok) {
                loadMerchSettings();
            } else {
                alert('Failed to update product availability status.');
                loadMerchSettings();
            }
        } catch (e) {
            console.error('Merch status update error', e);
            alert('Error updating merch availability.');
            loadMerchSettings();
        }
    }

    // ======================= //
    //    EXPORTS LOGIC        //
    // ======================= //
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            const visibleRows = Array.from(ordersTbody.querySelectorAll('.order-summary')).filter(row => row.style.display !== 'none');
            
            if (visibleRows.length === 0) {
                alert('No orders found to export.');
                return;
            }
            
            const data = [];
            data.push([
                "Order Number",
                "Order Date",
                "Customer Name",
                "Program, Year & Section",
                "Payment Method",
                "Payment Status",
                "Claim Status",
                "Total Amount (PHP)",
                "Items Ordered"
            ]);
            
            visibleRows.forEach(row => {
                const orderId = row.dataset.orderId;
                const order = allOrders.find(o => o._id === orderId);
                if (!order) return;
                
                const orderNum = String(order.orderNumber).padStart(4, '0');
                const date = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
                const itemsStr = (order.items || []).map(i => {
                    let parts = [];
                    if (i.size) parts.push(`Size: ${i.size}`);
                    if (i.customName) parts.push(`Custom Name: ${i.customName}`);
                    if (i.program) parts.push(`Program: ${i.program}`);
                    const details = parts.length > 0 ? ` (${parts.join(', ')})` : '';
                    return `${i.quantity}x ${i.name}${details}`;
                }).join('; ');
                
                data.push([
                    `#${orderNum}`,
                    date,
                    order.fullName,
                    order.programYear,
                    order.paymentMethod,
                    order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus === 'pending' ? 'Pending' : 'Not Paid'),
                    order.status === 'received' ? 'Received' : 'Not Received',
                    order.total,
                    itemsStr
                ]);
            });
            
            try {
                const ws = XLSX.utils.aoa_to_sheet(data);
                
                // Auto-fit column widths
                const wscols = [
                    {wch: 15}, // Order Number
                    {wch: 25}, // Order Date
                    {wch: 25}, // Customer Name
                    {wch: 25}, // Section
                    {wch: 18}, // Payment Method
                    {wch: 18}, // Payment Status
                    {wch: 18}, // Claim Status
                    {wch: 18}, // Total
                    {wch: 50}  // Items Ordered
                ];
                ws['!cols'] = wscols;
                
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Orders");
                XLSX.writeFile(wb, `COC_Orders_${new Date().toISOString().slice(0,10)}.xlsx`);
            } catch (err) {
                console.error('Error generating Excel file:', err);
                alert('Failed to generate Excel file. Make sure XLSX library is loaded correctly.');
            }
        });
    }

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

            let pClass = order.paymentStatus === 'paid' ? 'status-paid' : (order.paymentStatus === 'pending' ? 'status-pending' : 'status-not-paid');
            let pText = order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus === 'pending' ? 'Pending' : 'Not Paid');
            let dClass = order.status === 'received' ? 'status-received' : 'status-not-received';
            let dText = order.status === 'received' ? 'Received' : 'Not Received';

            const hasReceipt = order.receiptUrl && order.receiptUrl !== '';
            const receiptClass = hasReceipt ? 'has-receipt' : 'no-receipt';

            const summaryRow = document.createElement('tr');
            summaryRow.className = 'order-summary';
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

        // 3. Move to Trash
        if (e.target.classList.contains('delete-order')) {
            if (confirm('Move this order to Trash?')) {
                const res = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/move-to-trash`, { method: 'POST', credentials: 'include' });
                if (res.ok) {
                    loadOrders();
                } else {
                    const errData = await res.json();
                    alert('Failed to move order to trash.' + (errData.error || errData.message || 'Unknown error'));
                }
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
            const orderId = td.closest('.order-summary').dataset.orderId;
            const order = allOrders.find(o => o._id === orderId);
            if (!order) return;

            const select = document.createElement('select');
            const opts = isP ? ['Paid', 'Pending', 'Not Paid'] : ['Received', 'Not Received'];
            opts.forEach(o => { 
                const op = document.createElement('option'); 
                op.value = o; 
                op.textContent = o; 
                select.appendChild(op); 
            });

            // Set the correct selected option matching the current database state
            if (isP) {
                if (order.paymentStatus === 'paid') {
                    select.value = 'Paid';
                } else if (order.paymentStatus === 'pending') {
                    select.value = 'Pending';
                } else {
                    select.value = 'Not Paid';
                }
            } else {
                select.value = order.status === 'received' ? 'Received' : 'Not Received';
            }

            td.innerHTML = ''; 
            td.appendChild(select); 
            select.focus();

            let isSaving = false;
            select.onchange = async () => {
                isSaving = true;
                const body = isP ? { paymentStatus: select.value.toLowerCase() } : { status: select.value.toLowerCase() === 'received' ? 'received' : 'paid' };
                await fetch(`${CONFIG.API_URL}/api/orders/${orderId}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'}, 
                    credentials: 'include', 
                    body: JSON.stringify(body) 
                });
                loadOrders();
            };

            select.onblur = () => {
                setTimeout(() => {
                    if (!isSaving) {
                        displayOrders(allOrders);
                    }
                }, 150);
            };
        }
    });

    // ======================= //
    //    TRASH MODAL LOGIC    //
    // ======================= //
    const trashBtn = document.getElementById('open-trash-btn');
    if (trashBtn) {
        trashBtn.addEventListener('click', openTrashModal);
    }

    async function openTrashModal() {
        // Remove existing modal if any
        const existing = document.querySelector('.trash-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'receipt-modal trash-modal';
        modal.innerHTML = `
            <div class="trash-modal-content">
                <span class="close-modal">&times;</span>
                <div class="trash-header">
                    <h3><i class="fa-solid fa-trash-can"></i> Trash</h3>
                    <div class="trash-header-actions">
                        <button class="cleanup-expired-btn" title="Force delete all expired items">
                            <i class="fa-solid fa-broom"></i> Clean Up Expired
                        </button>
                        <button class="empty-trash-btn" title="Empty Trash">
                            <i class="fa-solid fa-trash"></i> Empty All
                        </button>
                    </div>
                </div>
                <p class="trash-note">Orders in trash are automatically deleted after 7 days.</p>
                <div class="trash-list"><p style="text-align:center; color:#999; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p></div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // Empty trash button
        modal.querySelector('.empty-trash-btn').onclick = async () => {
            if (!confirm('Permanently delete ALL orders in trash? This cannot be undone.')) return;
            const res = await fetch(`${CONFIG.API_URL}/api/orders/trash/empty`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                loadTrashList(modal);
            }
        };

        // Clean up expired items only (7+ days old)
        modal.querySelector('.cleanup-expired-btn').onclick = async () => {
            const res = await fetch(`${CONFIG.API_URL}/api/orders/trash/expired`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                loadTrashList(modal);
            } else {
                alert('Failed to clean up expired items.');
            }
        };

        loadTrashList(modal);
    }

    async function loadTrashList(modal) {
        const listContainer = modal.querySelector('.trash-list');
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/orders/trash`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const orders = await res.json();

            if (orders.length === 0) {
                listContainer.innerHTML = '<p class="trash-empty-msg"><i class="fa-solid fa-check-circle"></i> Trash is empty</p>';
                return;
            }

            listContainer.innerHTML = orders.map(order => {
                const orderNum = String(order.orderNumber).padStart(4, '0');
                const trashedDate = new Date(order.deletionWarningDate).toLocaleDateString();
                const daysLeft = order.daysUntilAutoDelete;
                const urgencyClass = daysLeft <= 2 ? 'trash-urgent' : '';
                const timerText = daysLeft > 0
                    ? `${daysLeft} day(s) left`
                    : 'Pending cleanup — overdue';
                return `
                    <div class="trash-item ${urgencyClass}" data-id="${order._id}">
                        <div class="trash-item-info">
                            <div class="trash-item-name"><strong>#${orderNum}</strong> — ${order.fullName}</div>
                            <div class="trash-item-meta">
                                ${order.programYear} · P${order.total.toFixed(2)} · ${order.paymentMethod}
                            </div>
                            <div class="trash-item-timer">
                                <i class="fa-solid fa-clock"></i> ${timerText} · Trashed ${trashedDate}
                            </div>
                        </div>
                        <div class="trash-item-actions">
                            <button class="trash-restore-btn" data-id="${order._id}" title="Restore">
                                <i class="fa-solid fa-rotate-left"></i> Restore
                            </button>
                            <button class="trash-delete-btn" data-id="${order._id}" title="Delete Permanently">
                                <i class="fa-solid fa-xmark"></i> Delete
                            </button>
                        </div>
                    </div>`;
            }).join('');

            // Restore buttons
            listContainer.querySelectorAll('.trash-restore-btn').forEach(btn => {
                btn.onclick = async () => {
                    const res = await fetch(`${CONFIG.API_URL}/api/orders/${btn.dataset.id}/restore`, { method: 'POST', credentials: 'include' });
                    if (res.ok) {
                        loadTrashList(modal);
                        loadOrders();
                    } else {
                        alert('Failed to restore order.');
                    }
                };
            });

            // Permanent delete buttons
            listContainer.querySelectorAll('.trash-delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('Permanently delete this order? This cannot be undone.')) return;
                    const res = await fetch(`${CONFIG.API_URL}/api/orders/${btn.dataset.id}/permanent-delete`, { method: 'DELETE', credentials: 'include' });
                    if (res.ok) {
                        loadTrashList(modal);
                    } else {
                        alert('Failed to delete order.');
                    }
                };
            });
        } catch (err) {
            console.error('Error loading trash:', err);
            listContainer.innerHTML = '<p style="text-align:center; color:#c62828;">Failed to load trash.</p>';
        }
    }

    // Initialize
    loadPaymentSettings();
    loadMerchSettings();
    loadOrders();
});