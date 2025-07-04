// server/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());

// --- Mock Database for Announcements ---
// We add more than 3 to test the scrolling feature.
const announcementsData = [
    { 
        id: 1, 
        title: "Opening of Classes", 
        summary: "Opening of classes will be on August.",
        fullDetail: "The official start of the 2025-2026 academic year will be on Monday, August 4th. All students are expected to have their registration completed by this date.",
        date: "May 27, 11:25 am"
    },
    { 
        id: 2, 
        title: "Upcoming June Event", 
        summary: "CDC Parangal will be on June 4.",
        fullDetail: "The annual College of Communications Parangal will be held at the university auditorium on June 4th at 2:00 PM to celebrate the achievements of our outstanding students and faculty.",
        date: "May 27, 10:25 am" 
    },
    { 
        id: 3, 
        title: "Claiming of Orders", 
        summary: "Orders can be claimed at the COCSC office.",
        fullDetail: "Students who have ordered college merchandise can claim their items at the COCSC office (Room 205) during vacant hours, from 9:00 AM to 4:00 PM, Mondays to Fridays.",
        date: "Jan 17, 10:13 am"
    },
    { 
        id: 4, 
        title: "Library System Maintenance", 
        summary: "The online library portal will be down for maintenance.",
        fullDetail: "Please be advised that the online library portal will be inaccessible on Saturday, June 7th, from 8:00 AM to 12:00 PM for a scheduled system upgrade.",
        date: "Jun 01, 09:00 am"
    }
];

// --- Mock Database for Calendar Events ---
const calendarEventsData = [
    {
        date: "2025-06-18",
        title: "Midterm Examinations",
        description: "Midterm exams for all major subjects begin."
    },
    {
        date: "2025-06-04",
        title: "CDC Parangal",
        description: "Annual awards ceremony at the university auditorium."
    }
];


// --- API Endpoints ---

// Endpoint to get all announcements
app.get('/api/announcements', (req, res) => {
    res.json(announcementsData);
});

// Endpoint to get all calendar events
app.get('/api/calendar-events', (req, res) => {
    res.json(calendarEventsData);
});

// The old greeting endpoint (can be removed, but fine to keep for testing)
app.get('/api/greeting', (req, res) => {
  res.json({ message: "Hello from the backend!" });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});