// server/index.js
require('dotenv').config(); // Loads environment variables from .env file
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies from POST requests

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch(err => console.error("MongoDB connection error:", err));

// --- Mongoose Schema & Model ---
// This defines the structure of our documents in the "announcements" collection
const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

// --- API Endpoints ---

// GET all announcements from the database
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ date: -1 }); // Get all, sorted by newest first
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: "Error fetching announcements", error: err });
    }
});

// POST a new announcement to the database
// (You can use Postman to test this endpoint and add data)
app.post('/api/announcements', async (req, res) => {
    const { title, content } = req.body;

    const newAnnouncement = new Announcement({
        title: title,
        content: content
    });

    try {
        const savedAnnouncement = await newAnnouncement.save();
        res.status(201).json(savedAnnouncement);
    } catch (err) {
        res.status(400).json({ message: "Error saving announcement", error: err });
    }
});

// --- Mongoose Schema & Model for Events ---
const eventSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Store date as "YYYY-MM-DD" string for easy matching
    title: { type: String, required: true },
    description: { type: String, required: true }
});

const Event = mongoose.model('Event', eventSchema);

// --- New API Endpoint for Events ---

// GET all events from the database
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: "Error fetching events", error: err });
    }
});

// POST a new event (for you to add data with Postman)
app.post('/api/events', async (req, res) => {
    const { date, title, description } = req.body;
    const newEvent = new Event({ date, title, description });
    try {
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(400).json({ message: "Error saving event", error: err });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

