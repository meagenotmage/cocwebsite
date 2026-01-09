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
    const announcementModalDatetime = document.getElementById('modal-datetime');
    const announcementModalBody = document.getElementById('modal-body');
    const announcementModalCloseBtn = document.querySelector('#announcement-modal .modal-close-btn');

    const monthYearHeader = document.getElementById('month-year-header');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    const eventModal = document.getElementById('event-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventModalDatetime = document.getElementById('event-modal-datetime');
    const eventModalDescription = document.getElementById('event-modal-description');
    const eventModalCloseBtn = document.getElementById('event-modal-close-btn');

    // --- Announcements Logic ---
    function showAnnouncementModal(announcement) {
        announcementModalTitle.textContent = announcement.title;
        
        // Format and display date and time
        const date = new Date(announcement.date);
        const formattedDateTime = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        announcementModalDatetime.textContent = formattedDateTime;
        
        announcementModalBody.textContent = announcement.content;
        announcementModal.classList.remove('hidden');
    }

    function hideAnnouncementModal() {
        announcementModal.classList.add('hidden');
    }

    async function fetchAndDisplayAnnouncements() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements`);
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

            // Check if any event falls on this day (check date, startDate, or endDate)
            const eventForDay = allEvents.find(e => {
                // Check if the date matches the main date field or startDate
                if (e.date === dateStr || e.startDate === dateStr) return true;
                
                // Check if date falls within the event range
                if (e.startDate && e.endDate) {
                    const eventStart = new Date(e.startDate);
                    const eventEnd = new Date(e.endDate);
                    const currentDay = new Date(dateStr);
                    return currentDay >= eventStart && currentDay <= eventEnd;
                }
                
                return false;
            });
            
            if (eventForDay) {
                dayDiv.classList.add('event-day');
                dayDiv.addEventListener('click', () => showEventModal(eventForDay, dateStr));
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
    function showEventModal(event, clickedDate) {
        eventModalTitle.textContent = event.title;
        
        // Format time and duration
        let timeText = '';
        
        // Display date range if both start and end dates exist
        if (event.startDate && event.endDate && event.startDate !== event.endDate) {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            const startFormatted = startDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            const endFormatted = endDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            timeText = `${startFormatted} - ${endFormatted}`;
        } else {
            // Single date event
            const dateToDisplay = event.startDate || event.date;
            if (dateToDisplay) {
                const eventDate = new Date(dateToDisplay);
                timeText = eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
            
            if (event.startTime && event.endTime) {
                // Convert 24-hour time to 12-hour format with AM/PM
                const formatTime = (timeStr) => {
                    const [hours, minutes] = timeStr.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    return `${hour12}:${minutes} ${ampm}`;
                };
                
                const startTimeFormatted = formatTime(event.startTime);
                const endTimeFormatted = formatTime(event.endTime);
                
                // Calculate duration
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                const startTotalMinutes = startHours * 60 + startMinutes;
                const endTotalMinutes = endHours * 60 + endMinutes;
                const durationMinutes = endTotalMinutes - startTotalMinutes;
                const durationHours = Math.floor(durationMinutes / 60);
                const durationMins = durationMinutes % 60;
                
                let durationText = '';
                if (durationHours > 0 && durationMins > 0) {
                    durationText = `${durationHours} hour${durationHours > 1 ? 's' : ''} ${durationMins} minute${durationMins > 1 ? 's' : ''}`;
                } else if (durationHours > 0) {
                    durationText = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
                } else {
                    durationText = `${durationMins} minute${durationMins > 1 ? 's' : ''}`;
                }
                
                timeText += ` • ${startTimeFormatted} - ${endTimeFormatted} (${durationText})`;
            }
        }
        
        eventModalDatetime.textContent = timeText;
        eventModalDescription.textContent = event.description;
        eventModal.classList.remove('hidden');
    }

    function hideEventModal() {
        eventModal.classList.add('hidden');
    }

    async function fetchEventsAndRender() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events`);
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

    // --- Initial Load ---
    fetchAndDisplayAnnouncements();
    fetchEventsAndRender();
});