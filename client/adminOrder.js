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
                console.error('Failed to load orders');
                ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Failed to load orders</td></tr>';
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Error loading orders. Please check if the server is running.</td></tr>';
        }
    }

    // Populate section filter with unique sections from orders
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

    // Display orders in the table
    function displayOrders(orders) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
            return;
        }

        // Sort orders by creation date (newest first) for easier viewing
        const sortedOrders = [...orders].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        ordersTbody.innerHTML = '';
        sortedOrders.forEach((order, index) => {
            // Use persistent orderNumber from database
            const orderNumber = String(order.orderNumber).padStart(4, '0');

            // Payment status badge
            let paymentStatusClass, paymentStatusText;
                if (order.paymentStatus === 'paid') {
                    paymentStatusClass = 'status-paid';
                    paymentStatusText = 'Paid';
                } else if (order.paymentStatus === 'pending') {
                    paymentStatusClass = 'status-pending';
                    paymentStatusText = 'Pending';
                } else {
                    // This covers 'pending' or any other default state
                    paymentStatusClass = 'status-not-paid';
                    paymentStatusText = 'Not Paid';
                }
                            
            // Determine received/delivery status display (Received or Not Received)
            let deliveryStatusText = 'Not Received';
            let deliveryStatusClass = 'status-not-received';
            if (order.status === 'received') {
                deliveryStatusText = 'Received';
                deliveryStatusClass = 'status-received';
            }
            
            // Format timestamp
            let timestamp = 'N/A';
            if (order.createdAt) {
                const orderDate = new Date(order.createdAt);
                timestamp = orderDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
            
            // Create summary row
            const summaryRow = document.createElement('tr');
            summaryRow.className = 'order-summary';
            if (order.markedForDeletion) {
                summaryRow.classList.add('marked-for-deletion');
            }
            summaryRow.dataset.name = order.fullName;
            summaryRow.dataset.orderId = order._id;
            summaryRow.dataset.payment = order.paymentMethod;
            summaryRow.dataset.section = order.programYear;
            summaryRow.dataset.items = order.items ? order.items.map(i => i.name).join('|').toLowerCase() : '';
            
            // Calculate days until deletion if marked
            let deletionWarningHTML = '';
            if (order.markedForDeletion && order.deletionWarningDate) {
                const deleteDate = new Date(order.deletionWarningDate);
                deleteDate.setDate(deleteDate.getDate() + 7);
                const daysUntilDeletion = Math.ceil((deleteDate - new Date()) / (1000 * 60 * 60 * 24));
                const warningClass = daysUntilDeletion <= 0 ? 'deletion-ready' : 'deletion-warning';
                deletionWarningHTML = `<span class="deletion-badge ${warningClass}" title="Marked for deletion">🗑️ ${Math.max(0, daysUntilDeletion)}d</span>`;
            }
            
            summaryRow.innerHTML = `
                <td>${order.fullName}</td>
                <td>${order.programYear}</td>
                <td>${order.paymentMethod}</td>
                <td>P ${order.total.toFixed(2)}</td>
                <td>${orderNumber}</td>
                <td class="timestamp">${timestamp}</td>
                <td class="payment-status-cell"><span class="${paymentStatusClass}">${paymentStatusText}</span></td>
                <td class="delivery-status-cell"><span class="${deliveryStatusClass}">${deliveryStatusText}</span></td>
                <td>
                    <div class="actions">
                        ${deletionWarningHTML}
                        <i class="fa-solid fa-chevron-down toggle-details"></i>
                        ${order.receiptUrl ? '<i class="fa-solid fa-image view-receipt" title="View Receipt" data-order-id="' + order._id + '"></i>' : ''}
                        ${order.markedForDeletion ? `<i class="fa-solid fa-undo cancel-deletion" title="Cancel Deletion" data-order-id="${order._id}"></i>` : `<i class="fa-solid fa-trash delete-order" title="Mark for Deletion" data-order-id="${order._id}"></i>`}
                    </div>
                </td>
            `;

            // Create details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'order-details';
            
            let itemsHTML = '';
            if (order.items && order.items.length > 0) {
                itemsHTML = order.items.map(item => {
                    // For items with custom names (nameplate and uniforms), show the custom name in the Name column
                    let customerName = order.fullName;
                    let productName = item.name;
                    
                    if (item.customName) {
                        customerName = item.customName;
                        productName = item.name;
                    }
                    
                    const programLabel = item.program ? `<br><span class="item-program">${item.program}</span>` : '';

                    return `
                        <tr>
                            <td>${customerName}${programLabel}</td>
                            <td>${productName}${item.size ? ' - ' + item.size : ''}</td>
                            <td>${item.quantity}</td>
                            <td>P ${item.price.toFixed(2)}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                itemsHTML = '<tr><td colspan="4">No item details available.</td></tr>';
            }

            // Receipt / payment proof sections in order details
            let receiptSection = '';
            if (isCashPayment(order.paymentMethod) && order.status === 'pending' && !order.receiptUrl) {
                receiptSection = `
                    <div class="cash-receipt-upload" data-order-id="${order._id}">
                        <h4><i class="fa-solid fa-money-bill-wave"></i> Cash Payment — Upload Receipt</h4>
                        <p class="verification-note">Upload a photo of the cash payment receipt as proof that this order has been paid.</p>
                        <div class="cash-receipt-controls">
                            <label class="cash-receipt-file-label">
                                <i class="fa-solid fa-camera"></i> Choose Receipt Photo
                                <input type="file" class="cash-receipt-input" accept="image/*" data-order-id="${order._id}">
                            </label>
                            <div class="cash-receipt-preview" id="preview-${order._id}"></div>
                            <button type="button" class="upload-cash-receipt-btn" data-order-id="${order._id}" disabled>
                                <i class="fa-solid fa-upload"></i> Upload & Mark as Paid
                            </button>
                        </div>
                    </div>
                `;
            } else if (order.receiptUrl && order.status === 'pending_payment' && isGcashPayment(order.paymentMethod)) {
                receiptSection = `
                    <div class="receipt-verification">
                        <h4>GCash Receipt Verification</h4>
                        <div class="receipt-actions">
                            <button class="verify-btn" data-order-id="${order._id}">
                                <i class="fa-solid fa-check"></i> Verify & Approve Payment
                            </button>
                            <button class="reject-btn" data-order-id="${order._id}">
                                <i class="fa-solid fa-times"></i> Reject Payment
                            </button>
                        </div>
                        <p class="verification-note">Please verify the GCash receipt before approving payment.</p>
                    </div>
                `;
            } else if (order.receiptUrl && isCashPayment(order.paymentMethod)) {
                receiptSection = `
                    <div class="cash-receipt-upload cash-receipt-done">
                        <h4><i class="fa-solid fa-circle-check"></i> Cash Payment Receipt Uploaded</h4>
                        <p class="verification-note">Payment proof is on file. Use the image icon in Actions to view the receipt.</p>
                    </div>
                `;
            }
            
            detailsRow.innerHTML = `
                <td colspan="9">
                    ${receiptSection}
                    <table class="details-table">
                        <thead>
                            <tr><th>Name</th><th>Product</th><th>Quantity</th><th>Price</th></tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </td>
            `;

            ordersTbody.appendChild(summaryRow);
            ordersTbody.appendChild(detailsRow);
        });
    }

    // Load orders on page load
    loadOrders();

    // 1. DROPDOWN TOGGLE LOGIC
    ordersTbody.addEventListener('click', function (e) {
        if (e.target.classList.contains('toggle-details')) {
            const summaryRow = e.target.closest('tr');
            const detailsRow = summaryRow.nextElementSibling;
            
            e.target.classList.toggle('is-open');
            detailsRow.classList.toggle('is-open');
        }
    });

    // 2. FILTER LOGIC - Search and Filters
    function applyFilters() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const paymentFilter = filterPayment.value.toLowerCase();
    const sectionFilter = filterSection.value;
    const itemFilter = filterItem.value.toLowerCase();
    const rows = ordersTbody.querySelectorAll('.order-summary');

    rows.forEach(row => {
        const name = (row.dataset.name || "").toLowerCase();
        const payment = (row.dataset.payment || "").toLowerCase();
        const section = (row.dataset.section || "");
        
        const matchesSearch = !searchQuery || 
            name.includes(searchQuery) || 
            payment.includes(searchQuery) || 
            section.toLowerCase().includes(searchQuery);

        const matchesPayment = !paymentFilter || payment === paymentFilter;
        const matchesSection = !sectionFilter || section === sectionFilter;
        
        if (matchesSearch && matchesPayment && matchesSection) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (row.nextElementSibling) row.nextElementSibling.style.display = 'none';
        }
    });
}

    // Add event listeners for all filters
    searchInput.addEventListener('keyup', applyFilters);
    filterPayment.addEventListener('change', applyFilters);
    filterSection.addEventListener('change', applyFilters);
    filterItem.addEventListener('change', applyFilters);

    // EXPORT TO EXCEL
    exportExcelBtn.addEventListener('click', function () {
        // Collect only currently visible orders
        const visibleRows = Array.from(ordersTbody.querySelectorAll('.order-summary')).filter(r => r.style.display !== 'none');
        const visibleIds = new Set(visibleRows.map(r => r.dataset.orderId));

        const rows = [['Order #', 'Name', 'Program / Year & Section', 'Payment Method', 'Total Amount', 'Order Time', 'Payment Status', 'Status', 'Items']];

        [...allOrders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .filter(order => visibleIds.has(order._id))
            .forEach(order => {
                const orderNumber = String(order.orderNumber).padStart(4, '0');

                let paymentStatusText = 'Not Paid';
                if (order.status === 'paid') paymentStatusText = 'Paid';
                else if (order.status === 'pending_payment') paymentStatusText = 'Pending';

                const deliveryStatusText = order.status === 'received' ? 'Received' : 'Not Received';

                let timestamp = 'N/A';
                if (order.createdAt) {
                    timestamp = new Date(order.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                }

                const itemsSummary = order.items
                    ? order.items.map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''} x${i.quantity}`).join(', ')
                    : '';

                rows.push([
                    orderNumber,
                    order.fullName,
                    order.programYear,
                    order.paymentMethod,
                    `P ${order.total.toFixed(2)}`,
                    timestamp,
                    paymentStatusText,
                    deliveryStatusText,
                    itemsSummary
                ]);
            });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [8, 22, 25, 16, 14, 22, 14, 14, 50].map(w => ({ wch: w }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');
        XLSX.writeFile(wb, 'orders.xlsx');
    });

    // 3. INLINE STATUS EDITING LOGIC
ordersTbody.addEventListener('click', function(e) {
    const target = e.target.closest('td');
    if (!target || !target.closest('.order-summary')) return;

    // Cell index 6 is "Payment Status", Cell index 7 is "Delivery Status"
    const isPaymentStatus = target.cellIndex === 6;
    const isDeliveryStatus = target.cellIndex === 7;

    if ((isPaymentStatus || isDeliveryStatus) && !target.querySelector('select')) {
        const currentStatus = target.querySelector('span')?.textContent.trim() || target.textContent.trim();
        const options = isPaymentStatus ? ['Paid', 'Pending', 'Not Paid'] : ['Received', 'Not Received'];

        const select = document.createElement('select');
        select.className = 'inline-status-select';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (option === currentStatus) opt.selected = true;
            select.appendChild(opt);
        });

        target.innerHTML = '';
        target.appendChild(select);
        select.focus();

        const handleUpdate = async () => {
            const newValue = select.value;
            const orderId = target.closest('.order-summary').dataset.orderId;
            
            let updateBody = {};

            if (isPaymentStatus) {
                // UPDATE THIS FIELD IN DB: paymentStatus
                if (newValue === 'Paid') updateBody.paymentStatus = 'paid';
                else if (newValue === 'Pending') updateBody.paymentStatus = 'pending';
                else updateBody.paymentStatus = 'pending'; // 'Not Paid' maps to pending
            } else {
                // UPDATE THIS FIELD IN DB: status
                updateBody.status = (newValue === 'Received') ? 'received' : 'pending';
            }

            try {
                const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(updateBody)
                });

                if (response.ok) {
                    const statusClass = `status-${newValue.toLowerCase().replace(/\s+/g, '-')}`;
                    target.innerHTML = `<span class="${statusClass}">${newValue}</span>`;
                    
                    // Update local allOrders array so it stays updated without refresh
                    const orderIdx = allOrders.findIndex(o => o._id === orderId);
                    if (orderIdx > -1) {
                        if (isPaymentStatus) allOrders[orderIdx].paymentStatus = updateBody.paymentStatus;
                        else allOrders[orderIdx].status = updateBody.status;
                    }
                } else {
                    const errData = await response.json();
                    alert("Error: " + errData.message);
                    loadOrders();
                }
            } catch (err) {
                console.error("Update error:", err);
                loadOrders();
            }
        };

        select.addEventListener('change', handleUpdate);
        select.addEventListener('blur', () => {
            // If the user didn't change anything, just revert back to text
            if (select.parentNode === target) {
                const statusClass = `status-${select.value.toLowerCase().replace(/\s+/g, '-')}`;
                target.innerHTML = `<span class="${statusClass}">${select.value}</span>`;
            }
        });
    }
});// This closes the event listener properly

    // 4. VIEW RECEIPT
    ordersTbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-receipt') || e.target.closest('.view-receipt')) {
            const target = e.target.classList.contains('view-receipt') ? e.target : e.target.closest('.view-receipt');
            const orderId = target.dataset.orderId;
            
            // Find the order in the allOrders array
            const order = allOrders.find(o => o._id === orderId);
            if (!order || !order.receiptUrl) {
                alert('No receipt available');
                return;
            }
            
            const receiptUrl = order.receiptUrl;
            const receiptTitle = isCashPayment(order.paymentMethod)
                ? 'Cash Payment Receipt'
                : 'GCash Payment Receipt';
            
            // Create modal to view receipt
            const modal = document.createElement('div');
            modal.className = 'receipt-modal';
            modal.innerHTML = `
                <div class="receipt-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>${receiptTitle}</h3>
                    <div class="receipt-image-container">
                        <div style="text-align: center; padding: 20px;">Loading image...</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Load image after modal is in DOM
            const container = modal.querySelector('.receipt-image-container');
            const img = document.createElement('img');
            img.className = 'receipt-image';
            img.alt = 'Payment Receipt';
            
            img.onload = function() {
                container.innerHTML = '';
                container.appendChild(img);
            };
            
            img.onerror = function() {
                container.innerHTML = '<p style="text-align: center; padding: 20px; color: #f44336;">Failed to load receipt image. The image may be corrupted or unavailable.</p>';
            };
            
            // Set image source - handle both base64 and URL formats
            if (receiptUrl.startsWith('data:image')) {
                img.src = receiptUrl;
            } else if (receiptUrl.startsWith('/uploads')) {
                img.src = `${CONFIG.API_URL}${receiptUrl}`;
            } else {
                img.src = receiptUrl;
            }
            
            // Close modal handlers
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('receipt-modal') || e.target.classList.contains('close-modal')) {
                    modal.remove();
                }
            });
        }
    });

    // 5. VERIFY/REJECT PAYMENT (GCash)
    ordersTbody.addEventListener('click', async function(e) {
        const target = e.target.closest('.verify-btn') || e.target.closest('.reject-btn');
        if (!target) return;

        const orderId = target.dataset.orderId;
        const isVerify = target.classList.contains('verify-btn');
        
        const action = isVerify ? 'verify and approve' : 'reject';
        if (confirm(`Are you sure you want to ${action} this payment?`)) {
            try {
                const newStatus = isVerify ? 'paid' : 'pending';
                const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    alert(`Payment ${isVerify ? 'approved' : 'rejected'} successfully!`);
                    loadOrders(); // Reload orders to reflect changes
                } else {
                    alert(`Failed to ${action} payment`);
                }
            } catch (error) {
                console.error('Error updating payment status:', error);
                alert(`Error ${action}ing payment`);
            }
        }
    });

    // 5b. CASH RECEIPT — preview selected image
    ordersTbody.addEventListener('change', function(e) {
        if (!e.target.classList.contains('cash-receipt-input')) return;

        const orderId = e.target.dataset.orderId;
        const preview = document.getElementById(`preview-${orderId}`);
        const uploadBtn = e.target.closest('.cash-receipt-upload')?.querySelector('.upload-cash-receipt-btn');
        const file = e.target.files[0];

        if (!preview || !uploadBtn) return;

        preview.innerHTML = '';
        uploadBtn.disabled = true;

        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, etc.).');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be 5MB or smaller.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(ev) {
            preview.innerHTML = `<img src="${ev.target.result}" alt="Receipt preview" class="cash-receipt-preview-img">`;
            uploadBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    });

    // 5c. CASH RECEIPT — upload and mark as paid
    ordersTbody.addEventListener('click', async function(e) {
        const btn = e.target.closest('.upload-cash-receipt-btn');
        if (!btn || btn.disabled) return;

        const orderId = btn.dataset.orderId;
        const container = btn.closest('.cash-receipt-upload');
        const input = container?.querySelector('.cash-receipt-input');
        const file = input?.files[0];

        if (!file) {
            alert('Please choose a receipt photo first.');
            return;
        }

        if (!confirm('Upload this receipt and mark the order as paid?')) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/receipt`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('Cash receipt uploaded. Order marked as paid.');
                loadOrders();
            } else {
                alert(result.message || 'Failed to upload receipt.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload & Mark as Paid';
            }
        } catch (error) {
            console.error('Error uploading cash receipt:', error);
            alert('Error uploading receipt. Please try again.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload & Mark as Paid';
        }
    });

    // 6. DELETE ACTION (Mark for Deletion with 7-day Warning)
    ordersTbody.addEventListener('click', async function(e) {
        if (e.target.classList.contains('fa-trash') || e.target.classList.contains('delete-order')) {
            const summaryRow = e.target.closest('tr');
            const orderId = summaryRow.dataset.orderId;

            if (confirm('Mark this order for deletion? It will be permanently deleted after 7 days.\n\nYou can cancel the deletion within 7 days.')) {
                try {
                    const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/mark-for-deletion`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const deleteDate = new Date(result.deleteDate);
                        alert(`Order #${String(result.order.orderNumber).padStart(4, '0')} marked for deletion.\n\nIt will be permanently deleted on:\n${deleteDate.toLocaleString()}`);
                        loadOrders(); // Refresh the order list
                    } else {
                        alert('Failed to mark order for deletion');
                    }
                } catch (error) {
                    console.error('Error marking order for deletion:', error);
                    alert('Error marking order for deletion');
                }
            }
        }
        
        // Cancel deletion
        if (e.target.classList.contains('fa-undo') || e.target.classList.contains('cancel-deletion')) {
            const summaryRow = e.target.closest('tr');
            const orderId = summaryRow.dataset.orderId;

            if (confirm('Cancel the deletion warning for this order?')) {
                try {
                    const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}/cancel-deletion`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        alert(`Deletion cancelled for order #${String(result.order.orderNumber).padStart(4, '0')}`);
                        loadOrders(); // Refresh the order list
                    } else {
                        alert('Failed to cancel deletion');
                    }
                } catch (error) {
                    console.error('Error cancelling deletion:', error);
                    alert('Error cancelling deletion');
                }
            }
        }
     });

});