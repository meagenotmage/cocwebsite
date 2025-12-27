document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = CONFIG.API_URL;

    // ======================= //
    //      ORDERS CHART       //
    // ======================= //
    const ctx = document.getElementById('ordersChart').getContext('2d');
    let ordersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['ID Lanyard', 'COC Type B Uniform', 'COC Type C Uniform', 'COC Nameplate'],
            datasets: [{
                label: 'Orders',
                data: [0, 0, 0, 0], // Will be updated from API
                backgroundColor: [
                    '#8B0000', // Dark Red
                    '#B22222', // Firebrick
                    '#CD5C5C', // Indian Red
                    '#E9967A'  // Dark Salmon
                ],
                borderColor: '#FFFFFF',
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false // Using custom HTML legend
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });

    // Fetch and update orders data
    async function loadOrdersData() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            
            const orders = await response.json();
            
            // Count items by product type
            const productCounts = {
                'ID Lanyard': 0,
                'COC Type B Uniform': 0,
                'COC Type C Uniform': 0,
                'COC Nameplate': 0
            };
            
            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (productCounts.hasOwnProperty(item.name)) {
                            productCounts[item.name] += item.quantity;
                        }
                    });
                }
            });
            
            // Update chart
            ordersChart.data.datasets[0].data = [
                productCounts['ID Lanyard'],
                productCounts['COC Type B Uniform'],
                productCounts['COC Type C Uniform'],
                productCounts['COC Nameplate']
            ];
            ordersChart.update();
            
        } catch (error) {
            console.error('Error loading orders data:', error);
        }
    }

    // Load orders data
    loadOrdersData();


    // ======================= //
    //    CALENDAR WIDGET      //
    // ======================= //
    const monthYearHeader = document.getElementById('month-year');
    const calendarDays = document.getElementById('calendar-days');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date();
    let eventDays = []; // Will be populated from events API

    // Fetch events from database
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events`);
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const events = await response.json();
            
            // Extract event days for current month
            updateEventDays(events);
            renderCalendar();
            
        } catch (error) {
            console.error('Error loading events:', error);
            renderCalendar(); // Render anyway without events
        }
    }

    function updateEventDays(events) {
        eventDays = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        events.forEach(event => {
            // Check if event falls in current month
            const eventDate = new Date(event.startDate || event.date);
            if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                eventDays.push(eventDate.getDate());
            }
        });
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearHeader.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        calendarDays.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
        const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

        // Adjust for Monday-first week (getDay() returns 0 for Sun)
        const startingDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        // Previous month's days
        for (let i = startingDay; i > 0; i--) {
        fetch(`${API_BASE_URL}/api/events`)
            .then(res => res.json())
            .then(events => {
                updateEventDays(events);
                renderCalendar();
            })
            .catch(() => renderCalendar());
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        fetch(`${API_BASE_URL}/api/events`)
            .then(res => res.json())
            .then(events => {
                updateEventDays(events);
                renderCalendar();
            })
            .catch(() => renderCalendar());
    });
    
    // Load events and render calendar
    loadEvents();

    // ======================= //
    //    ANNOUNCEMENTS        //
    // ======================= //
    async function loadAnnouncements() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements`);
            if (!response.ok) throw new Error('Failed to fetch announcements');
            
            const announcements = await response.json();
            const announcementList = document.querySelector('.announcement-list');
            
            if (!announcements || announcements.length === 0) {
                announcementList.innerHTML = '<div class="empty-state"><p>No Announcements Yet</p></div>';
                return;
            }
            
            // Sort by date (newest first) and take top 3
            const sortedAnnouncements = announcements
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);
            
            announcementList.innerHTML = sortedAnnouncements.map(announcement => {
                const date = new Date(announcement.date);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                
                return `
                    <div class="announcement-item">
                        <div class="item-header">
                            <h3>${announcement.title}</h3>
                            <span>${formattedDate}</span>
                        </div>
                        <p>${announcement.content}</p>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    // Load announcements
    loadAnnouncementsassName = 'date-cell';
            day.textContent = i;
            if (eventDays.includes(i)) {
                day.classList.add('event-day');
            }
            calendarDays.appendChild(day);
        }

        // Next month's days
        const totalCells = startingDay + lastDateOfMonth;
        const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells; i++) {
             const day = document.createElement('div');
            day.className = 'date-cell other-month';
            day.textContent = i;
            calendarDays.appendChild(day);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Initial render
    renderCalendar();
});