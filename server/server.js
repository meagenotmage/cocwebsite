require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: [
        'http://localhost:5500',   // This is your VS Code Live Server
        'http://127.0.0.1:5500', 
        'https://cocwebsite-rocz.onrender.com'
    ]
}));
app.use(express.json());

app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        res.status(200).json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// CHANGE THIS TO 3001
app.listen(3001, () => console.log('Server running on port 3001'));