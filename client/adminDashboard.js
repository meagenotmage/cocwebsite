document.addEventListener('DOMContentLoaded', function() {

    // ======================= //
    //      ORDERS CHART       //
    // ======================= //
    const ctx = document.getElementById('ordersChart').getContext('2d');
    const ordersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['ID Lanyard', 'COC Type B Uniform', 'COC Type C Uniform', 'COC Nameplate'],
            datasets: [{
                label: 'Orders',
                data: [45, 25, 15, 15], // Example data
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


    // ======================= //
    //    CALENDAR WIDGET      //
    // ======================= //
    const monthYearHeader = document.getElementById('month-year');
    const calendarDays = document.getElementById('calendar-days');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date(2025, 5, 1); // June 2025

    // Highlighted event days from the image
    const eventDays = [18, 27]; 

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
            const day = document.createElement('div');
            day.className = 'date-cell other-month';
            day.textContent = lastDateOfPrevMonth - i + 1;
            calendarDays.appendChild(day);
        }

        // Current month's days
        for (let i = 1; i <= lastDateOfMonth; i++) {
            const day = document.createElement('div');
            day.className = 'date-cell';
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