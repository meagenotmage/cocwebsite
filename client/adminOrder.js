document.addEventListener('DOMContentLoaded', function () {
    const ordersTbody = document.getElementById('orders-tbody');
    const searchInput = document.getElementById('search-name');

    // Load orders from API
    async function loadOrders() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/orders`);
            if (response.ok) {
                const orders = await response.json();
                displayOrders(orders);
            } else {
                console.error('Failed to load orders');
                ordersTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Failed to load orders</td></tr>';
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Error loading orders. Please check if the server is running.</td></tr>';
        }
    }

    // Display orders in the table
    function displayOrders(orders) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
            return;
        }

        ordersTbody.innerHTML = '';
        orders.forEach((order, index) => {
            const orderNumber = String(index + 1).padStart(4, '0');
            const paymentStatusClass = order.status === 'paid' ? 'status-paid' : 'status-not-paid';
            const receivedStatusClass = order.status === 'received' ? 'status-received' : 'status-not-received';
            
            // Determine payment status display
            let paymentStatusText = 'Not Paid';
            if (order.status === 'paid') {
                paymentStatusText = 'Paid ✓';
            } else if (order.status === 'pending_payment' && order.receiptUrl) {
                paymentStatusText = 'Pending Verification';
            }
            
            // Create summary row
            const summaryRow = document.createElement('tr');
            summaryRow.className = 'order-summary';
            summaryRow.dataset.name = order.fullName;
            summaryRow.dataset.orderId = order._id;
            summaryRow.innerHTML = `
                <td>${order.fullName}</td>
                <td>${order.programYear}</td>
                <td>${order.paymentMethod}</td>
                <td>P ${order.total.toFixed(2)}</td>
                <td>${orderNumber}</td>
                <td class="${order.status === 'pending_payment' && order.receiptUrl ? 'status-pending' : paymentStatusClass}">${paymentStatusText}</td>
                <td class="${receivedStatusClass}">${order.status === 'received' ? 'Received' : 'Not Received'}</td>
                <td class="actions">
                    <i class="fa-solid fa-chevron-down toggle-details"></i>
                    ${order.receiptUrl ? '<i class="fa-solid fa-image view-receipt" title="View Receipt" data-receipt="' + order.receiptUrl + '"></i>' : ''}
                    <i class="fa-solid fa-pencil"></i>
                    <i class="fa-solid fa-trash delete-order" data-order-id="${order._id}"></i>
                </td>
            `;

            // Create details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'order-details';
            
            let itemsHTML = '';
            if (order.items && order.items.length > 0) {
                itemsHTML = order.items.map(item => `
                    <tr>
                        <td>${order.fullName}</td>
                        <td>${item.name}${item.size ? ' - ' + item.size : ''}</td>
                        <td>${item.quantity}</td>
                        <td>P ${item.price.toFixed(2)}</td>
                    </tr>
                `).join('');
            } else {
                itemsHTML = '<tr><td colspan="4">No item details available.</td></tr>';
            }

            // Add receipt verification section if receipt exists
            let receiptSection = '';
            if (order.receiptUrl && order.status === 'pending_payment') {
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
            }
            
            detailsRow.innerHTML = `
                <td colspan="8">
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

    // 2. SEARCH FILTER LOGIC
    searchInput.addEventListener('keyup', function () {
        const query = searchInput.value.toLowerCase();
        const rows = ordersTbody.querySelectorAll('.order-summary');

        rows.forEach(row => {
            const name = row.dataset.name.toLowerCase();
            const detailsRow = row.nextElementSibling;
            
            if (name.includes(query)) {
                row.style.display = '';
                // Keep details visible if they were already open
                if (detailsRow.classList.contains('is-open')) {
                    detailsRow.style.display = '';
                }
            } else {
                row.style.display = 'none';
                detailsRow.style.display = 'none'; // Also hide details
            }
        });
    });

    // 3. INLINE STATUS EDITING LOGIC
    ordersTbody.addEventListener('click', function(e) {
        const target = e.target;
        // Check if a status cell was clicked and it's not already being edited
        if ((target.cellIndex === 5 || target.cellIndex === 6) && !target.querySelector('select')) {
            const currentStatus = target.textContent;
            const isPaymentStatus = target.cellIndex === 5;
            const options = isPaymentStatus ? ['Paid', 'Not Paid'] : ['Received', 'Not Received'];

            // Create a select dropdown
            const select = document.createElement('select');
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                if (option === currentStatus) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });

            // Replace cell content with the dropdown
            target.innerHTML = '';
            target.appendChild(select);
            select.focus();

            // Event listener to handle the change
            const handleUpdate = () => {
                const newValue = select.value;
                target.innerHTML = newValue; // Set text back
                // Update the class for styling
                target.className = `status-${newValue.toLowerCase().replace(' ', '-')}`;
            };
            
            select.addEventListener('change', handleUpdate);
            select.addEventListener('blur', handleUpdate); // Update when focus is lost
        }
    });

    // 4. VIEW RECEIPT
    ordersTbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-receipt') || e.target.closest('.view-receipt')) {
            const target = e.target.classList.contains('view-receipt') ? e.target : e.target.closest('.view-receipt');
            const receiptUrl = target.dataset.receipt;
            
            // Create modal to view receipt
            const modal = document.createElement('div');
            modal.className = 'receipt-modal';
            modal.innerHTML = `
                <div class="receipt-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>GCash Payment Receipt</h3>
                    <img src="${CONFIG.API_URL}${receiptUrl}" alt="Payment Receipt" class="receipt-image">
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal handlers
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('receipt-modal') || e.target.classList.contains('close-modal')) {
                    modal.remove();
                }
            });
        }
    });

    // 5. VERIFY/REJECT PAYMENT
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

    // 6. DELETE ACTION
    ordersTbody.addEventListener('click', async function(e) {
        if (e.target.classList.contains('fa-trash') || e.target.classList.contains('delete-order')) {
            const summaryRow = e.target.closest('tr');
            const orderId = summaryRow.dataset.orderId;
            const detailsRow = summaryRow.nextElementSibling;

            if (confirm('Are you sure you want to delete this order?')) {
                try {
                    const response = await fetch(`${CONFIG.API_URL}/api/orders/${orderId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        summaryRow.remove();
                        if (detailsRow && detailsRow.classList.contains('order-details')) {
                            detailsRow.remove();
                        }
                        alert('Order deleted successfully');
                    } else {
                        alert('Failed to delete order');
                    }
                } catch (error) {
                    console.error('Error deleting order:', error);
                    alert('Error deleting order');
                }
            }
        }
     });

});