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

    // Receipt upload handling
    let receiptFile = null;
    const receiptUpload = document.getElementById('receipt-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadPreview = document.getElementById('upload-preview');
    const previewImage = document.getElementById('preview-image');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const uploadStatus = document.getElementById('upload-status');
    const confirmBtn = document.getElementById('confirm-payment-btn');

    uploadBtn.addEventListener('click', () => {
        receiptUpload.click();
    });

    receiptUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                uploadStatus.textContent = 'Please upload an image file (JPG, PNG, etc.)';
                uploadStatus.style.color = '#E53935';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                uploadStatus.textContent = 'File size must be less than 5MB';
                uploadStatus.style.color = '#E53935';
                return;
            }

            receiptFile = file;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                uploadPreview.style.display = 'block';
                uploadBtn.style.display = 'none';
                uploadStatus.textContent = 'Receipt uploaded successfully!';
                uploadStatus.style.color = '#00A36C';
                
                // Enable confirm button
                confirmBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        receiptFile = null;
        receiptUpload.value = '';
        uploadPreview.style.display = 'none';
        uploadBtn.style.display = 'block';
        uploadStatus.textContent = '';
        confirmBtn.disabled = true;
    });

    // Confirm payment button
    confirmBtn.addEventListener('click', async () => {
        if (!receiptFile) {
            alert('Please upload your GCash payment receipt first.');
            return;
        }

        if (confirm('Have you uploaded the correct payment receipt?')) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Processing...';

            try {
                // Convert receipt to base64 for permanent storage
                const base64Image = await convertToBase64(receiptFile);

                // Update order status to "paid" with receipt base64
                const response = await fetch(`${CONFIG.API_URL}/api/orders/${pendingOrderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        status: 'paid',
                        receiptUrl: base64Image
                    })
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

    // Convert image file to base64 string
    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
});
