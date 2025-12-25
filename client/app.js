document.addEventListener('DOMContentLoaded', () => {

    // Use the API_URL from config.js
    const API_BASE_URL = CONFIG.API_URL;

    // --- State Variables ---
    let currentDate = new Date();
    let allEvents = [];

    // --- Element Selectors ---
    const announcementsContainer = document.getElementById('announcements-container');
    const announcementModal = document.getElementById('announcement-modal');
    const announcementModalTitle = document.getElementById('modal-title');
    const announcementModalBody = document.getElementById('modal-body');
    const announcementModalCloseBtn = document.querySelector('#announcement-modal .modal-close-btn');

    const monthYearHeader = document.getElementById('month-year-header');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    const eventModal = document.getElementById('event-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventModalDescription = document.getElementById('event-modal-description');
    const eventModalCloseBtn = document.getElementById('event-modal-close-btn');

    // --- Announcements Logic ---
    function showAnnouncementModal(announcement) {
        announcementModalTitle.textContent = announcement.title;
        announcementModalBody.textContent = announcement.content;
        announcementModal.classList.remove('hidden');
    }

    function hideAnnouncementModal() {
        announcementModal.classList.add('hidden');
    }

    async function fetchAndDisplayAnnouncements() {
        try {
            const response = await fetch(`${API_BASE_URL}/announcements`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const announcements = await response.json();

            announcementsContainer.innerHTML = ''; 

            if (announcements.length > 4) {
                announcementsContainer.classList.add('scrollable');
            } else {
                announcementsContainer.classList.remove('scrollable');
            }

            announcements.forEach(announcement => {
                const summary = announcement.content.substring(0, 50) + '...';
                const formattedDate = new Date(announcement.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
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
            announcementsContainer.innerHTML = '<p>Could not load announcements.</p>';
            console.error('Error fetching announcements:', error);
        }
    }

    // --- Calendar Logic ---
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearHeader.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const correctedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = correctedFirstDay; i > 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'prev-month-day';
            dayDiv.textContent = daysInPrevMonth - i + 1;
            calendarGrid.appendChild(dayDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            const today = new Date();
            if (i === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                dayDiv.classList.add('today');
            }

            const eventForDay = allEvents.find(e => e.date === dateStr);
            if (eventForDay) {
                dayDiv.classList.add('event-day');
                dayDiv.addEventListener('click', () => showEventModal(eventForDay));
            }

            calendarGrid.appendChild(dayDiv);
        }
        
        const totalGridCells = 42;
        const cellsRendered = correctedFirstDay + daysInMonth;
        const nextMonthDays = totalGridCells - cellsRendered;

        for (let i = 1; i <= nextMonthDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'next-month-day';
            dayDiv.textContent = i;
            calendarGrid.appendChild(dayDiv);
        }
    }
    
    // --- Event Modal Logic ---
    function showEventModal(event) {
        eventModalTitle.textContent = event.title;
        eventModalDescription.textContent = event.description;
        eventModal.classList.remove('hidden');
    }

    function hideEventModal() {
        eventModal.classList.add('hidden');
    }

    async function fetchEventsAndRender() {
        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            allEvents = await response.json();
            renderCalendar();
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }

    // --- Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    announcementModal.addEventListener('click', (e) => {
        if (e.target === announcementModal || e.target === announcementModalCloseBtn) {
            hideAnnouncementModal();
        }
    });

    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal || e.target === eventModalCloseBtn) {
            hideEventModal();
        }
    });

    // --- NEW: Hamburger Menu Logic ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavCloseBtn = document.getElementById('mobile-nav-close-btn');

    hamburgerBtn.addEventListener('click', () => {
        mobileNav.classList.add('open');
    });

    mobileNavCloseBtn.addEventListener('click', () => {
        mobileNav.classList.remove('open');
    });
    

    // --- Initial Load ---
    fetchAndDisplayAnnouncements();
    fetchEventsAndRender();
});