// --- 1. SETUP ---
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');
const hpp = require('hpp');

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
// Security: Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Security: Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 requests per 15 minutes
  message: 'Too many attempts, please try again later.',
});

// Security: Prevent MongoDB injection attacks
app.use(mongoSanitize());

// Security: Prevent HTTP Parameter Pollution
app.use(hpp());

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

// Input validation helper function
function sanitizeString(str) {
  if (!str) return '';
  return validator.escape(str.toString().trim());
}

// Create new announcement (POST)
app.post('/api/announcements', strictLimiter, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    // Validate input length
    if (title.length > 200) {
      return res.status(400).json({ message: 'Title is too long (max 200 characters).' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ message: 'Content is too long (max 2000 characters).' });
    }
    
    const announcement = new Announcement({
      title: sanitizeString(title),
      content: sanitizeString(content),
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
app.delete('/api/announcements/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID.' });
    }
    
    const announcement = await Announcement.findByIdAndDelete(id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }
    
    res.json({ message: 'Announcement deleted successfully!' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ message: 'Failed to delete announcement.', error: err.message });
  }
});

// Update announcement (PUT)
app.put('/api/announcements/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID.' });
    }

    // Validate input length
    if (title && title.length > 200) {
      return res.status(400).json({ message: 'Title is too long (max 200 characters).' });
    }
    if (content && content.length > 2000) {
      return res.status(400).json({ message: 'Content is too long (max 2000 characters).' });
    }
    
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { 
        title: title ? sanitizeString(title) : undefined,
        content: content ? sanitizeString(content) : undefined
      },
      { new: true }
    );
    
    res.json({ message: 'Announcement updated successfully!', announcement });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: 'Failed to update announcement.' });
  }
});

// Create new event (POST)
app.post('/api/events', strictLimiter, async (req, res) => {
  try {
    console.log('Received event creation request:', req.body);
    
    const { title, description, date, startDate, endDate, startTime, endTime, location } = req.body;
    
    if (!title || !date) {
      console.log('Validation failed: Missing title or date');
      return res.status(400).json({ message: 'Title and date are required.' });
    }

    // Validate input length
    if (title.length > 200) {
      return res.status(400).json({ message: 'Title is too long (max 200 characters).' });
    }
    if (description && description.length > 1000) {
      return res.status(400).json({ message: 'Description is too long (max 1000 characters).' });
    }
    if (location && location.length > 200) {
      return res.status(400).json({ message: 'Location is too long (max 200 characters).' });
    }
    
    const event = new Event({
      title: sanitizeString(title),
      description: description ? sanitizeString(description) : undefined,
      date: sanitizeString(date),
      startDate: startDate ? sanitizeString(startDate) : undefined,
      endDate: endDate ? sanitizeString(endDate) : undefined,
      startTime: startTime ? sanitizeString(startTime) : undefined,
      endTime: endTime ? sanitizeString(endTime) : undefined,
      location: location ? sanitizeString(location) : undefined
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
app.delete('/api/events/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }
    
    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event deleted successfully!' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

// Update event (PUT)
app.put('/api/events/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, startDate, endDate, startTime, endTime, location } = req.body;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    // Validate input length
    if (title && title.length > 200) {
      return res.status(400).json({ message: 'Title is too long (max 200 characters).' });
    }
    if (description && description.length > 1000) {
      return res.status(400).json({ message: 'Description is too long (max 1000 characters).' });
    }
    if (location && location.length > 200) {
      return res.status(400).json({ message: 'Location is too long (max 200 characters).' });
    }
    
    const event = await Event.findByIdAndUpdate(
      id,
      { 
        title: title ? sanitizeString(title) : undefined, 
        description: description ? sanitizeString(description) : undefined, 
        date: date ? sanitizeString(date) : undefined, 
        startDate: startDate ? sanitizeString(startDate) : undefined, 
        endDate: endDate ? sanitizeString(endDate) : undefined, 
        startTime: startTime ? sanitizeString(startTime) : undefined, 
        endTime: endTime ? sanitizeString(endTime) : undefined, 
        location: location ? sanitizeString(location) : undefined 
      },
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

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate input length
    if (fullName.length > 100) {
      return res.status(400).json({ message: 'Name is too long (max 100 characters).' });
    }
    if (phone.length > 20) {
      return res.status(400).json({ message: 'Phone number is too long (max 20 characters).' });
    }
    if (programYear.length > 50) {
      return res.status(400).json({ message: 'Program/Year is too long (max 50 characters).' });
    }

    // Validate payment method
    const validPaymentMethods = ['CASH', 'GCASH'];
    if (!validPaymentMethods.includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid payment method.' });
    }

    // Validate total is a positive number
    if (isNaN(total) || total <= 0) {
      return res.status(400).json({ message: 'Invalid order total.' });
    }
    
    const order = new Order({
      fullName: sanitizeString(fullName),
      phone: sanitizeString(phone),
      email: validator.normalizeEmail(email),
      programYear: sanitizeString(programYear),
      paymentMethod: paymentMethod.toUpperCase(),
      items: items.map(item => ({
        name: sanitizeString(item.name),
        size: item.size ? sanitizeString(item.size) : undefined,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        customName: item.customName ? sanitizeString(item.customName) : undefined
      })),
      total: parseFloat(total),
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
app.put('/api/orders/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, receiptUrl } = req.body;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'pending_payment', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (receiptUrl) updateData.receiptUrl = sanitizeString(receiptUrl);
    
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
app.delete('/api/orders/:id', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }
    
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