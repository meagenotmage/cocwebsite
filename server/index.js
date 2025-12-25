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
const announcementSchema = new mongoose.Schema({ 
  title: { type: String, required: true }, 
  content: { type: String, required: true }, 
  date: { type: Date, default: Date.now } 
});

const eventSchema = new mongoose.Schema({ 
  title: { type: String, required: true }, 
  description: String,
  date: { type: String, required: true },
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  location: String,
  createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const Event = mongoose.model('Event', eventSchema);


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

// --- ADMIN ROUTES ---

// Create new announcement (POST)
app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    
    const announcement = new Announcement({
      title,
      content,
      date: new Date()
    });
    
    await announcement.save();
    res.status(201).json({ message: 'Announcement created successfully!', announcement });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ message: 'Failed to create announcement.' });
  }
});

// Delete announcement (DELETE)
app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted successfully!' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});

// Update announcement (PUT)
app.put('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    );
    
    res.json({ message: 'Announcement updated successfully!', announcement });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: 'Failed to update announcement.' });
  }
});

// Create new event (POST)
app.post('/api/events', async (req, res) => {
  try {
    console.log('Received event creation request:', req.body);
    
    const { title, description, date, startDate, endDate, startTime, endTime, location } = req.body;
    
    if (!title || !date) {
      console.log('Validation failed: Missing title or date');
      return res.status(400).json({ message: 'Title and date are required.' });
    }
    
    const event = new Event({
      title,
      description,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      location
    });
    
    console.log('Attempting to save event:', event);
    const savedEvent = await event.save();
    console.log('Event saved successfully:', savedEvent);
    
    res.status(201).json({ message: 'Event created successfully!', event: savedEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event.', error: err.message });
  }
});

// Delete event (DELETE)
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event deleted successfully!' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

// Update event (PUT)
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, startDate, endDate, startTime, endTime, location } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      id,
      { title, description, date, startDate, endDate, startTime, endTime, location },
      { new: true }
    );
    
    res.json({ message: 'Event updated successfully!', event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event.' });
  }
});

// Add any other routes (e.g., app.post) here with the /api prefix

// --- 5. START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});