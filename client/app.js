// client/app.js

document.addEventListener('DOMContentLoaded', () => {

    // POINT THIS TO YOUR LIVE BACKEND!
   // Change this line in client/app.js
    const API_BASE_URL = 'https://coc-website.onrender.com/api'; 

    // --- Element Selectors ---
    const announcementsContainer = document.getElementById('announcements-container');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');

    const calendarGrid = document.getElementById('calendar-grid');
    const tooltip = document.getElementById('event-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipDescription = document.getElementById('tooltip-description');


    // --- Announcements Logic ---

    function showAnnouncementModal(announcement) {
        // Use 'title' and 'content' from your live API
        modalTitle.textContent = announcement.title;
        modalBody.textContent = announcement.content; // The full content goes in the modal
        modal.classList.remove('hidden');
    }

    function hideAnnouncementModal() {
        modal.classList.add('hidden');
    }

    async function fetchAndDisplayAnnouncements() {
        try {
            // Fetch from the /announcements endpoint of your live URL
            const response = await fetch(`${API_BASE_URL}/announcements`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const announcements = await response.json();

            announcementsContainer.innerHTML = '<h2>Announcements</h2>'; // Clear and add header

            if (announcements.length > 3) {
                announcementsContainer.classList.add('announcements-scrollable');
            }

            announcements.forEach(announcement => {
                // Create a short summary from the main content
                const summary = announcement.content.substring(0, 50) + '...';
                // Format the date to be more readable
                const formattedDate = new Date(announcement.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                });

                const item = document.createElement('div');
                item.className = 'announcement-item';
                item.innerHTML = `
                    <div>
                        <h3>${announcement.title}</h3>
                        <p>${summary}</p> 
                    </div>
                    <span class="date">${formattedDate}</span>
                `;
                
                item.addEventListener('click', () => showAnnouncementModal(announcement));
                announcementsContainer.appendChild(item);
            });
        } catch (error) {
            announcementsContainer.innerHTML = '<h2>Announcements</h2><p>Could not load announcements from the server.</p>';
            console.error('Error fetching announcements:', error);
        }
    }

    // --- Calendar Logic (This remains the same, using mock data) ---
    const calendarEventsData = [
        { date: "2025-06-18", title: "Midterm Examinations", description: "Midterm exams for all major subjects begin." },
        { date: "2025-06-04", title: "CDC Parangal", description: "Annual awards ceremony at the university auditorium." }
    ];

    function showTooltip(event, eventData) {
        tooltipTitle.textContent = eventData.title;
        tooltipDescription.textContent = eventData.description;
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.classList.remove('hidden');
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }
    
    function applyCalendarEvents() {
        calendarEventsData.forEach(eventData => {
            const dayElement = calendarGrid.querySelector(`[data-date="${eventData.date}"]`);
            if (dayElement) {
                dayElement.classList.add('event-day');
                dayElement.addEventListener('mousemove', (e) => showTooltip(e, eventData));
                dayElement.addEventListener('mouseleave', hideTooltip);
            }
        });
    }


    // --- Initial Load ---
    fetchAndDisplayAnnouncements();
    applyCalendarEvents(); // The calendar still uses local data

    // --- Global Event Listeners ---
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === modalCloseBtn) {
            hideAnnouncementModal();
        }
    });

});