document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - setUpEvent.js loaded');
    console.log('CONFIG available:', typeof CONFIG !== 'undefined');
    console.log('CONFIG.API_URL:', CONFIG?.API_URL);
    
    // ======================= //
    //   MOBILE NAV TOGGLE     //
    // ======================= //
    const sidebar = document.querySelector('.sidebar');
    const sidebarNav = document.querySelector('.sidebar-nav');
    
    if (sidebar && window.innerWidth <= 768) {
        sidebar.addEventListener('click', function(e) {
            if (e.target === sidebar || e.target.classList.contains('sidebar-title')) {
                sidebarNav.classList.toggle('active');
            }
        });
    }
    
    const API_BASE_URL = CONFIG.API_URL;
    console.log('API_BASE_URL set to:', API_BASE_URL);
    
    const eventForm = document.getElementById('event-form');
    const eventsTbody = document.getElementById('events-tbody');
    const clearButton = document.querySelector('.btn-clear');
    
    console.log('Form element found:', !!eventForm);
    console.log('Events tbody found:', !!eventsTbody);

    // Load existing events on page load
    loadEvents();

    // Handle form submission to add or update events
    if (!eventForm) {
        console.error('ERROR: Event form not found!');
        return;
    }
    
    eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        console.log('Form submitted!');

        // 1. Get values from the form
        const eventName = document.getElementById('event-name').value.trim();
        const description = document.getElementById('event-description')?.value.trim() || '';
        const location = document.getElementById('location').value.trim();
        const startDate = document.getElementById('start-date').value;
        const finishDate = document.getElementById('finish-date').value;
        const startTime = document.getElementById('start-time').value;
        const finishTime = document.getElementById('finish-time').value;
        
        console.log('Form values:', {
            eventName,
            description,
            location,
            startDate,
            finishDate,
            startTime,
            finishTime
        });
        
        // Basic validation
        if (!eventName || !startDate || !finishDate || !startTime || !finishTime) {
            alert('Please fill out all required fields.');
            return;
        }

        const eventData = {
            title: eventName,
            description: description,
            date: startDate, // Primary date for sorting
            startDate: startDate,
            endDate: finishDate,
            startTime: startTime,
            endTime: finishTime,
            location: location
        };

        const editId = eventForm.dataset.editId;
        const isEditing = !!editId;

        console.log('Sending to API:', API_BASE_URL + '/api/events');
        console.log('Event data:', eventData);
        console.log('Is editing:', isEditing);

        try {
            // 2. Send POST or PUT request to backend
            const url = isEditing 
                ? `${API_BASE_URL}/api/events/${editId}`
                : `${API_BASE_URL}/api/events`;
            
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
            }
            
            // 3. Show success message
            alert(`Event ${isEditing ? 'updated' : 'created'} successfully!`);
            
            // 4. Reload events list
            loadEvents();
            
            // 5. Clear the form and reset button
            eventForm.reset();
            delete eventForm.dataset.editId;
            document.querySelector('.btn-publish').textContent = 'Publish';
            
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, error);
            alert(`Failed to ${isEditing ? 'update' : 'create'} event: ` + error.message);
        }
    });

    // Load all events from database
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events`);
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const events = await response.json();
            
            // Clear existing rows
            eventsTbody.innerHTML = '';
            
            // Add each event to the table
            events.forEach(event => {
                const dateCreated = new Date(event.createdAt).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: '2-digit' 
                });

                const displayDates = event.startDate && event.endDate 
                    ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                    : formatDate(event.date);
                    
                const displayTimes = event.startTime && event.endTime
                    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                    : 'TBD';

                const newRow = document.createElement('tr');
                newRow.dataset.id = event._id;
                newRow.innerHTML = `
                    <td>${event.title}</td>
                    <td>${displayDates}</td>
                    <td>${displayTimes}</td>
                    <td class="status-upcoming">Upcoming</td>
                    <td>${dateCreated}</td>
                    <td class="actions">
                        <i class="fa-solid fa-pencil" title="Edit"></i>
                        <i class="fa-solid fa-trash" title="Delete"></i>
                    </td>
                `;

                eventsTbody.appendChild(newRow);
            });
            
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    // Handle 'Clear' button functionality
    clearButton.addEventListener('click', function() {
        eventForm.reset();
        delete eventForm.dataset.editId;
        document.querySelector('.btn-publish').textContent = 'Publish';
    });

    // Handle 'Delete' action using event delegation
    eventsTbody.addEventListener('click', async function(e) {
        const target = e.target;

        // Edit action
        if (target.classList.contains('fa-pencil')) {
            const row = target.closest('tr');
            const eventId = row.dataset.id;
            
            // Fetch full event data
            try {
                const response = await fetch(`${API_BASE_URL}/api/events`);
                if (!response.ok) throw new Error('Failed to fetch events');
                
                const events = await response.json();
                const event = events.find(e => e._id === eventId);
                
                if (!event) throw new Error('Event not found');
                
                // Populate form with event data
                document.getElementById('event-name').value = event.title || '';
                document.getElementById('event-description').value = event.description || '';
                document.getElementById('location').value = event.location || '';
                document.getElementById('start-date').value = event.startDate || event.date || '';
                document.getElementById('finish-date').value = event.endDate || event.date || '';
                document.getElementById('start-time').value = event.startTime || '';
                document.getElementById('finish-time').value = event.endTime || '';
                
                // Store the ID for updating
                eventForm.dataset.editId = eventId;
                
                // Change button text
                const publishBtn = document.querySelector('.btn-publish');
                publishBtn.textContent = 'Update';
                
                // Scroll to form
                eventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
            } catch (error) {
                console.error('Error loading event for edit:', error);
                alert('Failed to load event. Please try again.');
            }
        }

        // Delete action
        if (target.classList.contains('fa-trash')) {
            const row = target.closest('tr');
            const eventId = row.dataset.id;
            
            if (confirm('Are you sure you want to delete this event?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete event');
                    
                    alert('Event deleted successfully!');
                    loadEvents();
                    
                } catch (error) {
                    console.error('Error deleting event:', error);
                    alert('Failed to delete event. Please try again.');
                }
            }
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