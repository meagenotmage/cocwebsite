document.addEventListener('DOMContentLoaded', () => {
    const orderData = JSON.parse(sessionStorage.getItem('orderData'));

    if (!orderData) {
        alert('No order data found. Redirecting to order page.');
        window.location.href = 'order.html';
        return;
    }

    // Populate receipt with order data
    populateReceipt(orderData);
});

function populateReceipt(order) {
    // Generate receipt number from order ID or date
    const receiptNumber = order._id ? order._id.substring(order._id.length - 8).toUpperCase() : 'TEMP-' + Date.now();
    document.getElementById('receipt-number').textContent = receiptNumber;

    // Format date
    const orderDate = new Date(order.createdAt || Date.now());
    const formattedDate = orderDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    document.getElementById('receipt-date').textContent = formattedDate;

    // Payment method
    document.getElementById('payment-method').textContent = order.paymentMethod || 'CASH';

    // Payment status
    const paymentStatusElement = document.getElementById('payment-status');
    if (order.status === 'paid') {
        paymentStatusElement.textContent = 'Paid';
        paymentStatusElement.style.background = '#00A36C';
    } else if (order.status === 'pending_payment' || (order.paymentMethod === 'GCASH' && order.receiptUrl)) {
        paymentStatusElement.textContent = 'Pending for Verification';
        paymentStatusElement.style.background = '#FFA500';
    } else if (order.paymentMethod === 'CASH') {
        paymentStatusElement.textContent = 'Pending';
        paymentStatusElement.style.background = '#FFA500';
    } else {
        paymentStatusElement.textContent = 'Pending';
        paymentStatusElement.style.background = '#FFA500';
    }

    // Customer details
    document.getElementById('customer-name').textContent = order.fullName || 'N/A';
    document.getElementById('program-year').textContent = order.programYear || 'N/A';
    
    // Order number - fetch from session or use from order object
    const orderNumber = order.orderNumber || sessionStorage.getItem('orderNumber') || '0001';
    document.getElementById('order-number').textContent = orderNumber;

    // Order items
    const itemsTableBody = document.getElementById('receipt-items');
    if (order.items && order.items.length > 0) {
        itemsTableBody.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.name}${item.size ? ' - ' + item.size : ''}</td>
                <td>${item.quantity}</td>
                <td>₱ ${item.price.toFixed(2)}</td>
            </tr>
        `).join('');
    } else {
        itemsTableBody.innerHTML = '<tr><td colspan="3">No items</td></tr>';
    }

    // Total
    document.getElementById('receipt-total').textContent = `₱ ${order.total.toFixed(2)}`;

    // GCash receipt image
    if (order.paymentMethod === 'GCASH' && order.receiptUrl) {
        const paymentProofSection = document.getElementById('payment-proof-section');
        const gcashReceiptImg = document.getElementById('gcash-receipt');
        
        gcashReceiptImg.src = order.receiptUrl;
        paymentProofSection.style.display = 'block';
    }
}

function downloadReceipt() {
    const element = document.getElementById('receipt-content');
    const opt = {
        margin: 0.5,
        filename: `receipt-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Use html2pdf library to generate PDF
    html2pdf().set(opt).from(element).save();
}
