document.addEventListener('DOMContentLoaded', () => {
    const orderItemsList = document.getElementById('order-items-list');
    const totalItemsSpan = document.getElementById('total-items');
    const orderTotalSpan = document.getElementById('order-total');
    const checkoutForm = document.getElementById('checkout-form');
    const paymentBtns = document.querySelectorAll('.payment-btn');
    
    let orderData = JSON.parse(sessionStorage.getItem('checkoutData')) || [];
    let selectedPaymentMethod = 'online';

    // Load saved user data if "Remember Me" was checked before
    loadSavedUserData();

    // Payment method selection
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.dataset.method;
        });
    });

    // Set default payment method
    selectedPaymentMethod = 'gcash';

    // Load order items
    function displayOrderItems() {
        if (orderData.length === 0) {
            orderItemsList.innerHTML = '<p>No items in order. <a href="order.html">Go back to shop</a></p>';
            return;
        }

        orderItemsList.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;

        orderData.forEach((item, index) => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;

            const detailLabel = item.name.includes('Nameplate') ? 'Name' : 'Size';
            
            const orderItemDiv = document.createElement('div');
            orderItemDiv.classList.add('order-item');
            orderItemDiv.innerHTML = `
                <img src="${item.img || 'assets/placeholder.png'}" alt="${item.name}" class="order-item-img">
                <div class="order-item-details">
                    <h3>${item.name}</h3>
                    <p>${detailLabel}: <span class="detail-red">${item.detail}</span></p>
                    <div class="order-item-quantity">
                        <span>Quantity:</span>
                        <div class="quantity-controls">
                            <button type="button" class="minus-btn" data-index="${index}">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="plus-btn" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
                <div class="order-item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
                <button type="button" class="delete-item-btn" data-index="${index}">×</button>
            `;
            orderItemsList.appendChild(orderItemDiv);
        });

        totalItemsSpan.textContent = totalItems;
        orderTotalSpan.textContent = `€${totalPrice.toFixed(2)}`;

        // Add event listeners for quantity controls and delete
        attachQuantityControls();
    }

    function attachQuantityControls() {
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (orderData[index].quantity > 1) {
                    orderData[index].quantity--;
                    updateSessionStorage();
                    displayOrderItems();
                }
            });
        });

        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                orderData[index].quantity++;
                updateSessionStorage();
                displayOrderItems();
            });
        });

        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                orderData.splice(index, 1);
                updateSessionStorage();
                displayOrderItems();
            });
        });
    }

    function updateSessionStorage() {
        sessionStorage.setItem('checkoutData', JSON.stringify(orderData));
    }

    function loadSavedUserData() {
        const savedData = localStorage.getItem('userCheckoutData');
        if (savedData) {
            const userData = JSON.parse(savedData);
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('programYear').value = userData.programYear || '';
            document.getElementById('rememberMe').checked = true;
        }
    }

    function saveUserData(formData) {
        const userDataToSave = {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            programYear: formData.programYear
        };
        localStorage.setItem('userCheckoutData', JSON.stringify(userDataToSave));
    }

    function clearSavedUserData() {
        localStorage.removeItem('userCheckoutData');
    }

    // Submit order
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (orderData.length === 0) {
            alert('No items to checkout');
            return;
        }

        const rememberMe = document.getElementById('rememberMe').checked;

        const formData = {
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            programYear: document.getElementById('programYear').value,
            paymentMethod: selectedPaymentMethod.toUpperCase(),
            items: orderData.map(item => ({
                name: item.name,
                size: item.name.toLowerCase().includes('nameplate') ? undefined : item.detail,
                customName: item.name.toLowerCase().includes('nameplate') ? item.detail : undefined,
                quantity: item.quantity,
                price: item.price
            })),
            total: orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: selectedPaymentMethod === 'gcash' ? 'pending_payment' : 'pending'
        };

        // Save or clear user data based on Remember Me checkbox
        if (rememberMe) {
            saveUserData(formData);
        } else {
            clearSavedUserData();
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                sessionStorage.removeItem('checkoutData');
                
                // Store order number for receipt
                if (result.order && result.order.orderNumber) {
                    sessionStorage.setItem('orderNumber', result.order.orderNumber);
                }
                
                // Redirect to GCash payment or receipt based on payment method
                if (selectedPaymentMethod === 'gcash') {
                    // Store order ID and data for GCash payment
                    sessionStorage.setItem('pendingOrderId', result.order._id);
                    sessionStorage.setItem('orderData', JSON.stringify(result.order));
                    window.location.href = 'gcash-payment.html';
                } else {
                    // For cash, go directly to receipt
                    sessionStorage.setItem('orderData', JSON.stringify(result.order));
                    window.location.href = 'receipt.html';
                }
            } else {
                alert('Error placing order: ' + (result.message || 'Please try again'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error placing order. Please try again.');
        }
    });

    displayOrderItems();
});
