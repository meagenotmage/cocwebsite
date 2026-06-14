// DEPRECATED — Do not run this file. Use index.js instead: cd server && npm start
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// 1. DATABASE CONNECTION
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Connected to Database'))
    .catch(err => console.error('Database connection error:', err));

// 2. MODELS (With timestamps enabled for "Created Date")
const Announcement = mongoose.model('Announcement', new mongoose.Schema({
    title: String,
    content: String,
}, { timestamps: true }), 'announcements');

const Setting = mongoose.model('Setting', new mongoose.Schema({
    key: String,
    value: mongoose.Schema.Types.Mixed // Can store booleans or strings
}), 'settings');

const Event = mongoose.model('Event', new mongoose.Schema({
    title: String,
    description: String,
    startDate: String,
    location: String
}, { timestamps: true }), 'events');

const Feedback = mongoose.model('Feedback', new mongoose.Schema({
    type: String,
    message: String,
    isAnonymous: Boolean,
    senderName: String,
    senderEmail: String
}, { timestamps: true }), 'feedback');

const Order = mongoose.model('Order', new mongoose.Schema({
    items: Array,
    total: Number,
    paymentMethod: String, // 'Cash' or 'GCash'
    paymentStatus: { type: String, default: 'Unpaid' }, // 'Unpaid' or 'Paid'
    status: { type: String, default: 'Pending' },
    customerInfo: Object
}, { timestamps: true }), 'orders');


// 3. MIDDLEWARE
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://cocwebsite-rocz.onrender.com', 'https://college-of-communication.vercel.app'],
    credentials: true
}));
app.use(express.json());

// 4. GET ROUTES
app.get('/api/announcements', async (req, res) => res.json(await Announcement.find().sort({ createdAt: -1 })));
app.get('/api/events', async (req, res) => res.json(await Event.find().sort({ startDate: 1 })));
app.get('/api/feedback', async (req, res) => res.json(await Feedback.find().sort({ createdAt: -1 })));
app.get('/api/orders', async (req, res) => res.json(await Order.find().sort({ createdAt: -1 })));

// 5. POST ROUTES (Create)
app.post('/api/feedback', async (req, res) => {
    try {
        const fb = new Feedback(req.body);
        await fb.save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to send feedback" }); }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to place order" }); }
});

// 6. UPDATE & DELETE (The Admin Power Routes)
app.put('/api/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const models = { announcements: Announcement, events: Event, orders: Order, feedback: Feedback };
        const updated = await models[collection].findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/:collection/:id', async (req, res) => {
    try {
        const models = { announcements: Announcement, events: Event, orders: Order, feedback: Feedback };
        await models[req.params.collection].findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. TOGGLE SETTINGS (Cash/GCash/Orders On-Off)
app.get('/api/settings', async (req, res) => {
    const settings = await Setting.find();
    const settingsObj = settings.reduce((acc, setting) => {
        acc[curr.key] = curr.value;
        return acc;
}, {});
    res.json(settings);
});

app.put('/api/settings', async (req, res) => {
    const { key, value } = req.body;
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    res.json({ success: true });
});

app.listen(3001, () => console.log('Server running on port 3001'));