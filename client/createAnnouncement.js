document.addEventListener('DOMContentLoaded', function() {
    const announcementForm = document.getElementById('announcement-form');
    const announcementsTbody = document.getElementById('announcements-tbody');
    const clearButton = document.querySelector('.btn-clear');

    // Handle form submission to add new announcements
    announcementForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Get values from the form
        const nameInput = document.getElementById('announcement-name');
        const announcementName = nameInput.value.trim();

        // Basic validation
        if (!announcementName) {
            alert('Please enter an announcement name.');
            return;
        }

        // 2. Create a new table row
        const newRow = document.createElement('tr');
        const dateCreated = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

        newRow.innerHTML = `
            <td>${announcementName}</td>
            <td>${dateCreated}</td>
            <td class="actions">
                <i class="fa-solid fa-pencil"></i>
                <i class="fa-solid fa-trash"></i>
            </td>
        `;

        // 3. Add the new row to the table (at the top)
        announcementsTbody.prepend(newRow);

        // 4. Clear the form
        announcementForm.reset();
    });

    // Handle 'Clear' button functionality
    clearButton.addEventListener('click', function() {
        announcementForm.reset();
    });

    // Handle 'Edit' and 'Delete' actions using event delegation
    announcementsTbody.addEventListener('click', function(e) {
        const target = e.target;
        const row = target.closest('tr');

        if (!row) return;

        // Delete action
        if (target.classList.contains('fa-trash')) {
            if (confirm('Are you sure you want to delete this announcement?')) {
                row.remove();
            }
        }

        // Edit action (demonstration)
        if (target.classList.contains('fa-pencil')) {
            const announcementName = row.children[0].textContent;
            const newName = prompt("Edit announcement name:", announcementName);
            
            if (newName && newName.trim() !== "") {
                row.children[0].textContent = newName.trim();
            }
        }
    });
});