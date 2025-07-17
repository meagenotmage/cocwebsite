document.addEventListener('DOMContentLoaded', () => {
    const productModal = document.getElementById('product-modal');
    const cartModal = document.getElementById('cart-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const productItems = document.querySelectorAll('.product-item');
    const cartLink = document.getElementById('cart-link');
    const cartCountSpan = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const addToCartBtn = productModal.querySelector('.add-to-cart-btn');
    const checkoutBtns = document.querySelectorAll('.checkout-btn');
    const sizeButtons = productModal.querySelectorAll('.sizes button');
    const quantityInput = document.getElementById('quantity');
    const minusBtn = productModal.querySelector('.quantity-btn.minus');
    const plusBtn = productModal.querySelector('.quantity-btn.plus');
    const nameTemplateInputContainer = productModal.querySelector('.name-template-input');
    const nameTemplateInput = document.getElementById('template-name');
    const sizesContainer = productModal.querySelector('.sizes');
    let cart = [];
    let selectedSize = 'M';
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

    window.addEventListener('click', (event) => {
        if (event.target == productModal || event.target == cartModal) {
            productModal.style.display = 'none';
            cartModal.style.display = 'none';
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
                alert('Please enter a name for the nameplate.');
                return;
            }
            customDetail = nameTemplateInput.value.trim();
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
        alert(`${item.quantity} x ${item.name} added to cart!`);
    });

    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        updateCartDisplay();
        cartModal.style.display = 'flex';
    });

    checkoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Your cart is empty. Please add items before checking out.");
                return;
            }
            alert("Redirecting to checkout page...");
        });
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
});