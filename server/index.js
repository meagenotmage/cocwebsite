// --- 1. SETUP ---
require('dotenv').config({ path: require('path').join(__dirname, '.env') }); // Loads variables from .env file
const dns = require('dns');
// Work around ISP/router DNS that blocks MongoDB SRV lookups in Node (common on some networks)
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()));
} else {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;

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
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3001',
  'https://cocwebsiteend.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost
    if (origin.includes('localhost')) {
      callback(null, true);
    }
    // Allow all Vercel deployments
    else if (origin.includes('vercel.app')) {
      callback(null, true);
    }
    // Allow all Netlify deployments
    else if (origin.includes('netlify.app')) {
      callback(null, true);
    }
    // Check if origin is in allowed list
    else if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our list OR is a Vercel/Render subdomain
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('vercel.app') || 
                     origin.includes('onrender.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for sessions/cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Also increase URL encoded limit

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 10000 })
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

// Order Counter Schema - maintains persistent order numbering across deletions
const orderCounterSchema = new mongoose.Schema({
  _id: { type: String, default: 'orderCounter' },
  count: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number, unique: true, required: true }, // Persistent order number - survives deletions
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
    customName: String,
    program: String
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' },
  receiptUrl: { type: String },
  markedForDeletion: { type: Boolean, default: false },
  deletionWarningDate: { type: Date, default: null }, // Date when deletion warning was issued
  createdAt: { type: Date, default: Date.now }
});

// Prevent TTL indexes from accidentally deleting orders
orderSchema.set('skipVersioning', true);

const Announcement = mongoose.model('Announcement', announcementSchema);
const Event = mongoose.model('Event', eventSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);

const feedbackSchema = new mongoose.Schema({
  type: { type: String, enum: ['feedback', 'suggestion', 'partnership'], required: true },
  message: { type: String, required: true },
  isAnonymous: { type: Boolean, default: true },
  senderName: { type: String },
  senderEmail: { type: String },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  gcashEnabled: { type: Boolean, default: true },
  cashEnabled: { type: Boolean, default: true }
});
const Settings = mongoose.model('Settings', settingsSchema);


// --- 4. API ROUTES (WITH CORRECTED PATHS) ---

// Welcome route for the root URL
app.get('/', (req, res) => {
  res.send('COCSC API Server is running.');
});

// --- ADMIN AUTH ROUTES ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      return res.status(503).json({ message: 'Admin authentication is not configured.', success: false });
    }
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.', success: false });
    }
    if (email !== adminEmail) {
      return res.status(401).json({ message: 'Invalid credentials.', success: false });
    }

    const valid = await bcrypt.compare(password, adminPasswordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.', success: false });
    }

    req.session.isAdmin = true;
    req.session.email = email;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to create session.', success: false });
      }
      res.json({ message: 'Login successful.', success: true });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed.', success: false });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

app.get('/api/admin/check', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.isAdmin),
    email: req.session?.email
  });
});

// Announcements Route
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
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
app.post('/api/announcements', requireAuth, async (req, res) => {
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
app.delete('/api/announcements/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
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
app.put('/api/announcements/:id', requireAuth, async (req, res) => {
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
app.post('/api/events', requireAuth, async (req, res) => {
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
app.delete('/api/events/:id', requireAuth, async (req, res) => {
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
app.put('/api/events/:id', requireAuth, async (req, res) => {
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
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const { paymentMethod, status, paymentStatus } = req.query;
    let query = {};

    // Filtering logic
    if (paymentMethod) {
      // Use regex 'i' for case-insensitive matching (matches "cash" or "Cash")
      query.paymentMethod = { $regex: new RegExp(`^${paymentMethod}$`, 'i') };
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// Create new order (POST)
app.post('/api/orders', async (req, res) => {
  try {
    const { fullName, phone, email, programYear, paymentMethod, items, total, status, receiptUrl } = req.body;
    
    if (!fullName || !phone || !email || !programYear || !paymentMethod || !items || !total) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Get the next persistent order number using atomic counter
    let counter = await OrderCounter.findByIdAndUpdate(
      'orderCounter',
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    
    const orderNumber = counter.count;
    
    const order = new Order({
      orderNumber: orderNumber,
      fullName,
      phone,
      email,
      programYear,
      paymentMethod,
      items,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      receiptUrl: receiptUrl || undefined
    });
    
    await order.save();
    
    const orderWithNumber = order.toObject();
    
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

// Upload receipt (admin — cash payment proof or general)
app.post('/api/orders/:id/receipt', requireAuth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt image uploaded.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;
    const updateData = { receiptUrl };
    const method = (order.paymentMethod || '').toUpperCase();

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Receipt uploaded successfully!', order: updated });
  } catch (err) {
    console.error('Error uploading order receipt:', err);
    res.status(500).json({ message: 'Failed to upload receipt.', error: err.message });
  }
});

// Update order status (for admin)
app.put('/api/orders/:id', requireAuth, async (req, res) => {
   try {
    const { id } = req.params;
    const { status, paymentStatus, receiptUrl } = req.body;

    console.log(`--- UPDATE ATTEMPT START ---`);
    console.log(`Order ID: ${id}`);
    console.log(`Data Received:`, JSON.stringify(req.body));

    // 1. Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid MongoDB ID format");
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    // 2. Build update object - being very explicit
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;

    // 3. Perform the update
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true,           // Return the document AFTER update
        runValidators: true, // Ensure it matches schema
        upsert: false        // Don't create a new one if it doesn't exist
      }
    );

    if (!updatedOrder) {
      console.error(`Order with ID ${id} not found in database.`);
      return res.status(404).json({ message: 'Order not found in database.' });
    }

    console.log(`SUCCESS: Order updated. New status: ${updatedOrder.status}, New paymentStatus: ${updatedOrder.paymentStatus}`);
    console.log(`--- UPDATE ATTEMPT END ---`);

    res.json({ 
      message: 'Order updated successfully!', 
      order: updatedOrder 
    });

  } catch (err) {
    console.error('--- UPDATE ERROR ---');
    console.error(err);
    res.status(500).json({ 
      message: 'Failed to update order.', 
      error: err.message 
    });
  }
});

// Delete order (for admin) - DISABLED. Use mark-for-deletion instead for safety
// app.delete('/api/orders/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Order.findByIdAndDelete(id);
//     res.json({ message: 'Order deleted successfully!' });
//   } catch (err) {
//     console.error('Error deleting order:', err);
//     res.status(500).json({ message: 'Failed to delete order.' });
//   }
// });

// Mark order for deletion with 7-day warning (for admin)
app.post('/api/orders/:id/mark-for-deletion', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { 
        markedForDeletion: true,
        deletionWarningDate: new Date()
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    
    const deleteDate = new Date(order.deletionWarningDate);
    deleteDate.setDate(deleteDate.getDate() + 7);
    
    res.json({ 
      message: 'Order marked for deletion with 7-day warning.',
      order,
      deleteDate: deleteDate.toISOString(),
      daysUntilDeletion: 7
    });
  } catch (err) {
    console.error('Error marking order for deletion:', err);
    res.status(500).json({ message: 'Failed to mark order for deletion.' });
  }
});

// Get orders marked for deletion (for admin)
app.get('/api/orders/marked-for-deletion', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ markedForDeletion: true }).sort({ deletionWarningDate: -1 });
    
    const ordersWithWarningInfo = orders.map(order => {
      const deleteDate = new Date(order.deletionWarningDate);
      deleteDate.setDate(deleteDate.getDate() + 7);
      const daysUntilDeletion = Math.ceil((deleteDate - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        ...order.toObject(),
        deleteDate: deleteDate.toISOString(),
        daysUntilDeletion: Math.max(0, daysUntilDeletion)
      };
    });
    
    res.json(ordersWithWarningInfo);
  } catch (err) {
    console.error('Error fetching marked orders:', err);
    res.status(500).json({ message: 'Failed to fetch marked orders.' });
  }
});

// Cancel deletion warning (for admin)
app.post('/api/orders/:id/cancel-deletion', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { 
        markedForDeletion: false,
        deletionWarningDate: null
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    
    res.json({ 
      message: 'Deletion warning cancelled.',
      order
    });
  } catch (err) {
    console.error('Error cancelling deletion:', err);
    res.status(500).json({ message: 'Failed to cancel deletion.' });
  }
});

// Get deletion warnings (orders that are 7+ days marked and ready to delete)
app.get('/api/orders/deletion-warnings', requireAuth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const ordersReadyForDeletion = await Order.find({
      markedForDeletion: true,
      deletionWarningDate: { $lte: sevenDaysAgo }
    }).sort({ deletionWarningDate: 1 });
    
    res.json({
      warningCount: ordersReadyForDeletion.length,
      orders: ordersReadyForDeletion,
      message: `${ordersReadyForDeletion.length} order(s) ready for permanent deletion after 7-day warning period.`
    });
  } catch (err) {
    console.error('Error fetching deletion warnings:', err);
    res.status(500).json({ message: 'Failed to fetch deletion warnings.' });
  }
});

// Permanently delete order after 7-day warning period (for admin only)
app.delete('/api/orders/:id/permanent-delete', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    
    if (!order.markedForDeletion) {
      return res.status(400).json({ message: 'Order has not been marked for deletion. Use /mark-for-deletion first.' });
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (order.deletionWarningDate > sevenDaysAgo) {
      const deleteDate = new Date(order.deletionWarningDate);
      deleteDate.setDate(deleteDate.getDate() + 7);
      return res.status(400).json({ 
        message: 'Deletion warning period has not expired yet.',
        deleteDate: deleteDate.toISOString()
      });
    }
    
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order permanently deleted after 7-day warning period.' });
  } catch (err) {
    console.error('Error permanently deleting order:', err);
    res.status(500).json({ message: 'Failed to permanently delete order.' });
  }
});


// --- FEEDBACK ROUTES ---

// Submit feedback (POST) — public
app.post('/api/feedback', async (req, res) => {
  try {
    const { type, message, isAnonymous, senderName, senderEmail } = req.body;

    if (!type || !['feedback', 'suggestion', 'partnership'].includes(type)) {
      return res.status(400).json({ message: 'A valid submission type is required.' });
    }
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const feedback = new Feedback({
      type,
      message: message.trim(),
      isAnonymous: isAnonymous !== false,
      senderName: senderName ? senderName.trim() : undefined,
      senderEmail: senderEmail ? senderEmail.trim().toLowerCase() : undefined
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Failed to submit feedback.' });
  }
});

// Get all feedback (GET) — admin; accepts ?type= filter
app.get('/api/feedback', requireAuth, async (req, res) => {
  try {
    const query = {};
    if (req.query.type && ['feedback', 'suggestion', 'partnership'].includes(req.query.type)) {
      query.type = req.query.type;
    }
    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
});

// Update feedback status / admin notes (PUT) — admin
app.put('/api/feedback/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData = {};
    if (status && ['unread', 'read'].includes(status)) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const feedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });

    res.json({ message: 'Feedback updated successfully!', feedback });
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({ message: 'Failed to update feedback.' });
  }
});

// Delete feedback (DELETE) — admin
app.delete('/api/feedback/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Feedback.findByIdAndDelete(id);
    res.json({ message: 'Feedback deleted successfully!' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ message: 'Failed to delete feedback.' });
  }
});

// --- PAYMENT SETTINGS ROUTES ---

// Get payment settings (public — used by checkout page)
app.get('/api/settings/payment', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'payment' });
    if (!settings) {
      settings = await Settings.create({ key: 'payment', gcashEnabled: true, cashEnabled: true });
    }
    res.json({ gcashEnabled: settings.gcashEnabled, cashEnabled: settings.cashEnabled });
  } catch (err) {
    console.error('Error fetching payment settings:', err);
    res.status(500).json({ message: 'Failed to fetch payment settings.' });
  }
});

// Update payment settings (admin)
app.put('/api/settings/payment', requireAuth, async (req, res) => {
  try {
    const { gcashEnabled, cashEnabled } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'payment' },
      { gcashEnabled, cashEnabled },
      { new: true, upsert: true }
    );
    res.json({ message: 'Payment settings updated!', gcashEnabled: settings.gcashEnabled, cashEnabled: settings.cashEnabled });
  } catch (err) {
    console.error('Error updating payment settings:', err);
    res.status(500).json({ message: 'Failed to update payment settings.' });
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

// --- 4b. DELETION WARNING CHECK ---
async function checkDeletionWarnings() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const threeHoursFromNow = new Date();
    threeHoursFromNow.setHours(threeHoursFromNow.getHours() + 3);
    
    // Get orders ready for deletion (7+ days marked)
    const readyForDeletion = await Order.find({
      markedForDeletion: true,
      deletionWarningDate: { $lte: sevenDaysAgo }
    });
    
    // Get orders with warning expiring soon (3+ days, but less than 7)
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const ordersWithWarningExpiringSoon = await Order.find({
      markedForDeletion: true,
      deletionWarningDate: { $gt: sevenDaysAgo, $lte: sixDaysAgo }
    });
    
    if (readyForDeletion.length > 0) {
      console.warn(`
⚠️  [DELETION ALERT] ${readyForDeletion.length} order(s) marked for deletion are now ready for permanent deletion!
Orders: ${readyForDeletion.map(o => `#${o.orderNumber}`).join(', ')}
Action required: Admin must call DELETE /api/orders/:id/permanent-delete to finalize deletion.
      `);
    }
    
    if (ordersWithWarningExpiringSoon.length > 0) {
      console.log(`
⚠️  [DELETION WARNING] ${ordersWithWarningExpiringSoon.length} order(s) will be ready for deletion soon (in 1-3 days).
Orders: ${ordersWithWarningExpiringSoon.map(o => `#${o.orderNumber}`).join(', ')}
      `);
    }
  } catch (err) {
    console.error('Error checking deletion warnings:', err);
  }
}


// --- 5. START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Check for orders marked for deletion on startup
  checkDeletionWarnings();
  
  // Check for deletion warnings every 24 hours
  setInterval(checkDeletionWarnings, 24 * 60 * 60 * 1000);
  
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