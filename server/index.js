// --- 1. SETUP ---
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// --- 2. MIDDLEWARE ---
// Configure CORS to allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:8080'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => console.error('Database connection error:', err));

// Define your Mongoose schemas and models here (e.g., Announcement, Event)
const Announcement = mongoose.model('Announcement', new mongoose.Schema({ title: String, content: String, date: Date }));
const Event = mongoose.model('Event', new mongoose.Schema({ title: String, description: String, date: String }));


// --- 4. API ROUTES (WITH CORRECTED PATHS) ---

// Welcome route for the root URL
app.get('/', (req, res) => {
  res.send('COCSC API Server is running.');
});

// Announcements Route
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements.' });
  }
});

// Events Route
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

// Add any other routes (e.g., app.post) here with the /api prefix

// --- 5. START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});