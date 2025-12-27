document.addEventListener('DOMContentLoaded', () => {
    const orderData = JSON.parse(sessionStorage.getItem('orderData'));
    const pendingOrderId = sessionStorage.getItem('pendingOrderId');

    if (!orderData || !pendingOrderId) {
        alert('No order data found. Redirecting to order page.');
        window.location.href = 'order.html';
        return;
    }

    // Display order items
    displayOrderItems(orderData);

    // Confirm payment button
    const confirmBtn = document.getElementById('confirm-payment-btn');
    confirmBtn.addEventListener('click', async () => {
        if (confirm('Have you completed the GCash payment?')) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Processing...';

            try {
                // Update order status to "paid"
                const response = await fetch(`${CONFIG.API_URL}/api/orders/${pendingOrderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'paid' })
                });

                if (response.ok) {
                    // Update local order data
                    orderData.status = 'paid';
                    sessionStorage.setItem('orderData', JSON.stringify(orderData));
                    sessionStorage.removeItem('pendingOrderId');
                    
                    // Redirect to receipt
                    window.location.href = 'receipt.html';
                } else {
                    alert('Failed to confirm payment. Please try again.');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'I have sent the payment';
                }
            } catch (error) {
                console.error('Error confirming payment:', error);
                alert('Error confirming payment. Please try again.');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'I have sent the payment';
            }
        }
    });

    function displayOrderItems(order) {
        const orderItemsList = document.getElementById('payment-order-items');
        const totalElement = document.getElementById('payment-total');

        if (!order.items || order.items.length === 0) {
            orderItemsList.innerHTML = '<p>No items in order</p>';
            return;
        }

        orderItemsList.innerHTML = order.items.map(item => `
            <div class="payment-order-item">
                <div class="item-info">
                    <h4>${item.name}${item.size ? ' - ' + item.size : ''}</h4>
                    <p>Quantity: ${item.quantity} × ₱${item.price.toFixed(2)}</p>
                </div>
                <div class="item-price">
                    ₱${(item.quantity * item.price).toFixed(2)}
                </div>
            </div>
        `).join('');

        totalElement.textContent = `₱${order.total.toFixed(2)}`;
    }
});
