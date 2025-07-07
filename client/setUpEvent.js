document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('event-form');
    const eventsTbody = document.getElementById('events-tbody');
    const clearButton = document.querySelector('.btn-clear');

    // Handle form submission to add or update events
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Get values from the form
        const eventName = document.getElementById('event-name').value;
        const location = document.getElementById('location').value;
        const startDate = document.getElementById('start-date').value;
        const finishDate = document.getElementById('finish-date').value;
        const startTime = document.getElementById('start-time').value;
        const finishTime = document.getElementById('finish-time').value;
        
        // Basic validation
        if (!eventName || !startDate || !finishDate || !startTime || !finishTime) {
            alert('Please fill out all required fields.');
            return;
        }

        // 2. Create a new table row
        const newRow = document.createElement('tr');
        
        // Format dates and times for display
        const displayDates = `${formatDate(startDate)} - ${formatDate(finishDate)}`;
        const displayTimes = `${formatTime(startTime)} - ${formatTime(finishTime)}`;
        const dateCreated = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

        newRow.innerHTML = `
            <td>${eventName}</td>
            <td>${displayDates}</td>
            <td>${displayTimes}</td>
            <td class="status-upcoming">Upcoming</td>
            <td>${dateCreated}</td>
            <td class="actions">
                <i class="fa-solid fa-pencil"></i>
                <i class="fa-solid fa-trash"></i>
            </td>
        `;

        // 3. Add the new row to the table
        eventsTbody.appendChild(newRow);

        // 4. Clear the form
        eventForm.reset();
    });

    // Handle 'Clear' button functionality
    clearButton.addEventListener('click', function() {
        eventForm.reset();
    });

    // Handle 'Edit' and 'Delete' actions using event delegation
    eventsTbody.addEventListener('click', function(e) {
        const target = e.target;

        // Delete action
        if (target.classList.contains('fa-trash')) {
            const row = target.closest('tr');
            if (confirm('Are you sure you want to delete this event?')) {
                row.remove();
            }
        }

        // Edit action
        if (target.classList.contains('fa-pencil')) {
            const row = target.closest('tr');
            // This is a simplified "edit": it just logs data.
            // A full implementation would populate the form with the row's data.
            const eventName = row.children[0].textContent;
            console.log(`Editing event: ${eventName}`);
            alert(`Editing functionality is for demonstration. You clicked edit for "${eventName}".`);
        }
    });

    // Helper function to format date from 'YYYY-MM-DD' to 'MM.DD.YYYY'
    function formatDate(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${month}.${day}.${year}`;
    }

    // Helper function to format time from 24-hour to 12-hour AM/PM
    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 === 0 ? 12 : h % 12;
        return `${String(formattedHour).padStart(2, '0')}:${minutes} ${ampm}`;
    }
});