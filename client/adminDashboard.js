document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = CONFIG.API_URL;

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
    //      EVENTS LIST        //
    // ======================= //
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events`);
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const events = await response.json();
            const eventsList = document.querySelector('.events-list');
            
            if (!events || events.length === 0) {
                eventsList.innerHTML = '<div class="empty-state"><p>No Events Yet</p></div>';
                return;
            }
            
            // Sort events by start date (upcoming first)
            const sortedEvents = events.sort((a, b) => {
                const dateA = new Date(a.startDate || a.date);
                const dateB = new Date(b.startDate || b.date);
                return dateA - dateB;
            });
            
            eventsList.innerHTML = sortedEvents.map(event => {
                const startDate = new Date(event.startDate || event.date);
                const endDate = event.endDate ? new Date(event.endDate) : null;
                
                const formattedStartDate = startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
                
                const formattedStartTime = event.startTime || 'TBA';
                const formattedEndTime = event.endTime || '';
                const timeRange = formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime;
                
                const dateRange = endDate && endDate.getTime() !== startDate.getTime() 
                    ? `${formattedStartDate} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : formattedStartDate;
                
                return `
                    <div class="event-item">
                        <div class="event-date">
                            <div class="date-badge">
                                <span class="day">${startDate.getDate()}</span>
                                <span class="month">${startDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                        </div>
                        <div class="event-details">
                            <h3>${event.title || event.name}</h3>
                            <div class="event-info">
                                <div class="info-item">
                                    <i class="fa-solid fa-calendar"></i>
                                    <span>${dateRange}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fa-solid fa-clock"></i>
                                    <span>${timeRange}</span>
                                </div>
                                ${event.location ? `
                                <div class="info-item">
                                    <i class="fa-solid fa-location-dot"></i>
                                    <span>${event.location}</span>
                                </div>
                                ` : ''}
                            </div>
                            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading events:', error);
            const eventsList = document.querySelector('.events-list');
            eventsList.innerHTML = '<div class="empty-state"><p>Failed to load events</p></div>';
        }
    }
    
    // Load events
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
    loadAnnouncements();
});