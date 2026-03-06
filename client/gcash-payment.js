document.addEventListener('DOMContentLoaded', () => {
    const orderData = JSON.parse(sessionStorage.getItem('pendingOrderData'));

    if (!orderData) {
        alert('No order data found. Redirecting to order page.');
        window.location.href = 'order.html';
        return;
    }

    // 20-minute session timer
    const TIMEOUT_MS = 20 * 60 * 1000;
    const TIMER_KEY = 'gcashSessionExpiry';
    const timerDisplay = document.getElementById('timer-display');
    const timerContainer = document.getElementById('session-timer');

    // Set expiry if not already set (first visit)
    if (!sessionStorage.getItem(TIMER_KEY)) {
        sessionStorage.setItem(TIMER_KEY, Date.now() + TIMEOUT_MS);
    }

    function updateTimer() {
        const expiry = parseInt(sessionStorage.getItem(TIMER_KEY), 10);
        const remaining = expiry - Date.now();

        if (remaining <= 0) {
            clearInterval(timerInterval);
            sessionStorage.removeItem(TIMER_KEY);
            sessionStorage.removeItem('pendingOrderData');
            alert('Your payment session has expired. Please start your order again.');
            window.location.href = 'checkout.html';
            return;
        }

        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Warn when under 5 minutes
        if (remaining < 5 * 60 * 1000) {
            timerContainer.classList.add('timer-warning');
        }
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // Display order items
    displayOrderItems(orderData);

    // Copy GCash number
    const copyBtn = document.getElementById('copy-gcash-btn');
    const copyIcon = document.getElementById('copy-icon');
    const gcashNumber = document.getElementById('gcash-number');

    copyBtn.addEventListener('click', () => {
        const number = gcashNumber.textContent.replace(/\s+/g, '');
        navigator.clipboard.writeText(number).then(() => {
            copyIcon.classList.replace('fa-copy', 'fa-check');
            copyBtn.classList.add('copied');
            copyBtn.title = 'Copied!';
            setTimeout(() => {
                copyIcon.classList.replace('fa-check', 'fa-copy');
                copyBtn.classList.remove('copied');
                copyBtn.title = 'Copy GCash number';
            }, 2000);
        });
    });

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

                // NOW create the order in the DB — only after receipt is uploaded
                const response = await fetch(`${CONFIG.API_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...orderData,
                        status: 'paid',
                        receiptUrl: base64Image
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Store confirmed order for receipt page
                    if (result.order && result.order.orderNumber) {
                        sessionStorage.setItem('orderNumber', result.order.orderNumber);
                    }
                    sessionStorage.setItem('orderData', JSON.stringify(result.order));
                    sessionStorage.removeItem('pendingOrderData');
                    sessionStorage.removeItem('gcashSessionExpiry');
                    
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
