document.addEventListener('DOMContentLoaded', () => {

    // Use the API_URL from config.js
    const API_URL = CONFIG.API_URL;

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
            const response = await fetch(getApiUrl('ANNOUNCEMENTS'));
            if (!response.ok) throw new Error(`Status: ${response.status}`);
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
            announcementsContainer.innerHTML = '<p>Could not load announcements. Is the server running at ' + CONFIG.API_URL + '?</p>';
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

            // Check if any events fall on this day (check date, startDate, or endDate)
            const eventsForDay = allEvents.filter(e => {
                // Check if the date matches the main date field or startDate
                if (e.date === dateStr || e.startDate === dateStr) return true;
                
                // Check if date falls within the event range
                if (e.startDate && e.endDate) {
                    const eventStart = new Date(e.startDate);
                    const eventEnd = new Date(e.endDate);
                    const currentDay = new Date(dateStr);
                    // Clear times to compare dates accurately in local timezone
                    eventStart.setHours(0,0,0,0);
                    eventEnd.setHours(0,0,0,0);
                    currentDay.setHours(0,0,0,0);
                    return currentDay >= eventStart && currentDay <= eventEnd;
                }
                
                return false;
            });
            
            if (eventsForDay.length > 0) {
                dayDiv.classList.add('event-day');
                dayDiv.addEventListener('click', () => showEventModal(eventsForDay, dateStr));
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
    function showEventModal(events, clickedDate) {
        const eventList = Array.isArray(events) ? events : [events];
        const modalContent = eventModal.querySelector('.modal-content');
        
        let html = `<button id="event-modal-close-btn" class="modal-close-btn" aria-label="Close modal">×</button>`;
        
        eventList.forEach((event, index) => {
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

            // Location
            const locationHtml = event.location 
                ? `<p class="modal-location" style="margin-bottom: 8px; font-size: 0.95rem; color: #555;"><i class="fa-solid fa-location-dot"></i> <strong>Location:</strong> ${event.location}</p>`
                : '';
            
            html += `
                <div class="modal-event-item" style="${index > 0 ? 'border-top: 1px solid #ddd; padding-top: 24px; margin-top: 24px;' : ''}">
                    <h2 style="margin-top: 0; color: var(--primary-red); margin-bottom: 12px; font-size: 1.6rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        ${event.title}
                    </h2>
                    <p class="modal-datetime" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px; font-weight: 500;">
                        <i class="fa-solid fa-calendar-days"></i> ${timeText}
                    </p>
                    ${locationHtml}
                    <p style="color: var(--text-color); line-height: 1.7; font-size: 1rem; margin-top: 12px; white-space: pre-wrap;">
                        ${event.description || ''}
                    </p>
                </div>
            `;
        });
        
        modalContent.innerHTML = html;
        
        // Re-attach close button listener
        document.getElementById('event-modal-close-btn').addEventListener('click', hideEventModal);
        
        eventModal.classList.remove('hidden');
    }

    function hideEventModal() {
        eventModal.classList.add('hidden');
    }

    async function fetchEventsAndRender() {
        try {
        const response = await fetch(getApiUrl('EVENTS'));
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
        if (e.target === eventModal || e.target.id === 'event-modal-close-btn' || e.target.closest('#event-modal-close-btn')) {
            hideEventModal();
        }
    });

    // --- Initial Load ---
    fetchAndDisplayAnnouncements();
    fetchEventsAndRender();
});