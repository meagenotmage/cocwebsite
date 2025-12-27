document.addEventListener('DOMContentLoaded', () => {
    const productModal = document.getElementById('product-modal');
    const cartModal = document.getElementById('cart-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const productItems = document.querySelectorAll('.product-item');
    const cartLink = document.getElementById('cart-link');
    const cartCountSpan = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const addToCartBtn = productModal.querySelector('.add-to-cart-btn');
    const productModalCheckoutBtn = productModal.querySelector('.checkout-btn');
    const cartModalCheckoutBtn = cartModal.querySelector('.checkout-btn');
    const confirmationOkBtn = document.getElementById('confirmation-ok-btn');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const sizeButtons = productModal.querySelectorAll('.sizes button');
    const quantityInput = document.getElementById('quantity');
    const minusBtn = productModal.querySelector('.quantity-btn.minus');
    const plusBtn = productModal.querySelector('.quantity-btn.plus');
    const nameTemplateInputContainer = productModal.querySelector('.name-template-input');
    const nameTemplateInput = document.getElementById('template-name');
    const sizesContainer = productModal.querySelector('.sizes');
    let cart = [];
    let selectedSize = '';
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    const merchandiseGrid = document.querySelector('.merchandise-grid');

    if (scrollLeftBtn && scrollRightBtn && merchandiseGrid) {
        const scrollAmount = 330;
        scrollRightBtn.addEventListener('click', () => {
            merchandiseGrid.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        scrollLeftBtn.addEventListener('click', () => {
            merchandiseGrid.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    productItems.forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const price = item.dataset.price;
            const imgSrc = item.dataset.imgSrc;
            const id = item.dataset.id;
            productModal.querySelector('#modal-name').textContent = name;
            productModal.querySelector('#modal-price').textContent = `₱ ${price}`;
            productModal.querySelector('#modal-img').src = imgSrc;
            addToCartBtn.dataset.id = id;
            addToCartBtn.dataset.name = name;
            addToCartBtn.dataset.price = price;
            addToCartBtn.dataset.img = imgSrc;
            quantityInput.value = '1';
            
            if (name === 'COC Nameplate') {
                sizesContainer.style.display = 'none';
                nameTemplateInputContainer.style.display = 'block';
                nameTemplateInput.value = '';
            } else {
                sizesContainer.style.display = 'block';
                nameTemplateInputContainer.style.display = 'none';
                setActiveSize('');
            }
            productModal.style.display = 'flex';
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            productModal.style.display = 'none';
            cartModal.style.display = 'none';
        });
    });

    confirmationOkBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == productModal || event.target == cartModal) {
            productModal.style.display = 'none';
            cartModal.style.display = 'none';
        }
        if (event.target == confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });

    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveSize(button.textContent);
        });
    });

    minusBtn.addEventListener('click', () => {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let currentValue = parseInt(quantityInput.value);
        quantityInput.value = currentValue + 1;
    });

    addToCartBtn.addEventListener('click', (e) => {
        let customDetail = selectedSize;
        if (e.target.dataset.name === 'COC Nameplate') {
            if(nameTemplateInput.value.trim() === '') {
                showConfirmation('Error', '<p>Please enter a name for the nameplate.</p>', false);
                return;
            }
            customDetail = nameTemplateInput.value.trim();
        } else if (!selectedSize) {
            showConfirmation('Error', '<p>Please select a size.</p>', false);
            return;
        }

        const item = {
            id: e.target.dataset.id,
            name: e.target.dataset.name,
            price: parseFloat(e.target.dataset.price),
            quantity: parseInt(quantityInput.value),
            detail: customDetail,
            img: e.target.dataset.img
        };

        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id && cartItem.detail === item.detail);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }
        updateCart();
        productModal.style.display = 'none';
        
        const detailLabel = item.name === 'COC Nameplate' ? 'Name' : 'Size';
        showConfirmation(
            'Added to Cart!',
            `<p><strong>${item.quantity} x ${item.name}</strong></p>
             <p>${detailLabel}: ${item.detail}</p>
             <p>Price: ₱${(item.price * item.quantity).toFixed(2)}</p>`
        );
    });

    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        updateCartDisplay();
        cartModal.style.display = 'flex';
    });

    // Direct checkout from product modal
    productModalCheckoutBtn.addEventListener('click', () => {
        let customDetail = selectedSize;
        const productName = addToCartBtn.dataset.name;
        
        if (productName === 'COC Nameplate') {
            if(nameTemplateInput.value.trim() === '') {
                showConfirmation('Error', '<p>Please enter a name for the nameplate.</p>', false);
                return;
            }
            customDetail = nameTemplateInput.value.trim();
        } else if (!selectedSize) {
            showConfirmation('Error', '<p>Please select a size.</p>', false);
            return;
        }

        const item = {
            id: addToCartBtn.dataset.id,
            name: productName,
            price: parseFloat(addToCartBtn.dataset.price),
            quantity: parseInt(quantityInput.value),
            detail: customDetail,
            img: addToCartBtn.dataset.img
        };

        // Store in session and redirect to checkout
        sessionStorage.setItem('checkoutData', JSON.stringify([item]));
        window.location.href = 'checkout.html';
    });

    // Checkout from cart
    cartModalCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showConfirmation('Cart Empty', '<p>Please add items to your cart before checking out.</p>', false);
            return;
        }
        
        // Store cart in session and redirect to checkout
        sessionStorage.setItem('checkoutData', JSON.stringify(cart));
        window.location.href = 'checkout.html';
    });

    function setActiveSize(size) {
        selectedSize = size;
        sizeButtons.forEach(btn => {
            if (btn.textContent === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updateCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
    }

    function removeItemFromCart(index) {
        cart.splice(index, 1);
        updateCart();
        updateCartDisplay();
    }
    
    function addDeleteEventListeners() {
        const deleteButtons = document.querySelectorAll('.cart-item-delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemIndex = parseInt(e.target.dataset.index, 10);
                removeItemFromCart(itemIndex);
            });
        });
    }

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalPriceSpan.textContent = '₱0.00';
            return;
        }
        let totalPrice = 0;
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            const detailLabel = item.name === 'COC Nameplate' ? 'Name' : 'Size';
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <p>${item.name}</p>
                    <p>${detailLabel}: ${item.detail}</p>
                    <p>Qty: ${item.quantity}</p>
                </div>
                <div class="cart-item-price">₱${itemTotal.toFixed(2)}</div>
                <button class="cart-item-delete-btn" data-index="${index}">×</button>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });
        cartTotalPriceSpan.textContent = `₱${totalPrice.toFixed(2)}`;
        addDeleteEventListeners();
    }

    function showConfirmation(title, message, isSuccess = true) {
        confirmationTitle.textContent = title;
        confirmationMessage.innerHTML = message;
        
        const icon = confirmationModal.querySelector('.confirmation-icon i');
        if (isSuccess) {
            icon.className = 'fa-solid fa-check-circle';
            icon.style.color = '#28a745';
        } else {
            icon.className = 'fa-solid fa-exclamation-circle';
            icon.style.color = '#E53935';
        }
        
        confirmationModal.style.display = 'flex';
    }
});
