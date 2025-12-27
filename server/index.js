// --- 1. SETUP ---
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `receipt-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Also increase URL encoded limit
// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

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

const orderSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  programYear: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    size: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    customName: String
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  receiptUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const Event = mongoose.model('Event', eventSchema);
const Order = mongoose.model('Order', orderSchema);


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

// Orders Routes
// Get all orders (for admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// Create new order (POST)
app.post('/api/orders', async (req, res) => {
  try {
    const { fullName, phone, email, programYear, paymentMethod, items, total, status } = req.body;
    
    if (!fullName || !phone || !email || !programYear || !paymentMethod || !items || !total) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    const order = new Order({
      fullName,
      phone,
      email,
      programYear,
      paymentMethod,
      items,
      total,
      status: status || 'pending'
    });
    
    await order.save();
    
    // Calculate order number based on creation order
    const allOrders = await Order.find().sort({ createdAt: 1 });
    const orderIndex = allOrders.findIndex(o => o._id.toString() === order._id.toString());
    const orderNumber = String(orderIndex + 1).padStart(4, '0');
    
    // Add order number to response
    const orderWithNumber = order.toObject();
    orderWithNumber.orderNumber = orderNumber;
    
    res.status(201).json({ message: 'Order placed successfully!', order: orderWithNumber });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to place order.', error: err.message });
  }
});

// Upload GCash receipt
app.post('/api/orders/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({ 
      message: 'Receipt uploaded successfully!', 
      receiptUrl: receiptUrl 
    });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ message: 'Failed to upload receipt.', error: err.message });
  }
});

// Update order status (for admin)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, receiptUrl } = req.body;
    
    const updateData = { status };
    if (receiptUrl) {
      updateData.receiptUrl = receiptUrl;
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.json({ message: 'Order updated successfully!', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order.' });
  }
});

// Delete order (for admin)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted successfully!' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ message: 'Failed to delete order.' });
  }
});

// Health check endpoint for keep-alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- 5. START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Self-ping to keep Render service active (every 14 minutes)
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_SERVICE_URL) {
    const selfPingInterval = 14 * 60 * 1000; // 14 minutes
    setInterval(() => {
      const protocol = process.env.RENDER_SERVICE_URL.startsWith('https') ? require('https') : require('http');
      const url = `${process.env.RENDER_SERVICE_URL}/api/health`;
      
      protocol.get(url, (res) => {
        console.log(`[${new Date().toISOString()}] Self-ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Self-ping failed:`, err.message);
      });
    }, selfPingInterval);
    
    console.log('Keep-alive mechanism enabled');
  }
});