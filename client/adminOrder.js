document.addEventListener('DOMContentLoaded', function () {
    const ordersTbody = document.getElementById('orders-tbody');
    const searchInput = document.getElementById('search-name');

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

    // 4. DELETE ACTION
     ordersTbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('fa-trash')) {
            const summaryRow = e.target.closest('tr');
            const detailsRow = summaryRow.nextElementSibling;

            if (confirm('Are you sure you want to delete this order?')) {
                summaryRow.remove();
                if (detailsRow && detailsRow.classList.contains('order-details')) {
                    detailsRow.remove();
                }
            }
        }
     });

});