const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 3000;

// --- 1. ADMIN CREDENTIALS ---
const ADMIN_USER = "admin@vr";
const ADMIN_PASS = "rajkumar@vr"; // Password updated here

// --- 2. MIDDLEWARE & SESSIONS ---
app.use(cors());
app.use(express.json());

// Set up secure server-side sessions
app.use(session({
    secret: 'vr-photography-super-secret-key-2026', // Encrypts the session cookie
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // Session lasts 24 hours
    }
}));

// Serve frontend files
app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist on startup
const categories = ['wedding', 'baby-shower', 'outdoor', 'baby-shoot'];
categories.forEach(category => {
    const dir = path.join(__dirname, 'uploads', category);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure Image Storage (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'uncategorized';
        const dir = path.join(__dirname, 'uploads', category);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage });

// --- 3. AUTHENTICATION APIs ---

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isAuthenticated = true; // Create the session
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Check if user is logged in (used on page load)
app.get('/api/check-auth', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy(); // Destroy the session on the server
    res.json({ success: true });
});

// Middleware to block unauthorized access
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
};

// --- 4. DATA APIs ---

// PUBLIC: Get images for gallery (Frontend needs this to be public)
app.get('/api/images/:category', (req, res) => {
    const category = req.params.category;
    const dir = path.join(__dirname, 'uploads', category);
    
    if (!fs.existsSync(dir)) return res.json([]);
    
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });
        const images = files.map(file => `/uploads/${category}/${file}`);
        res.json(images);
    });
});

// PROTECTED: Upload an image (Requires Session)
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ success: true, path: `/uploads/${req.body.category}/${req.file.filename}` });
});

// PROTECTED: Delete an image (Requires Session)
app.delete('/api/images/:category/:filename', requireAuth, (req, res) => {
    const { category, filename } = req.params;
    const filepath = path.join(__dirname, 'uploads', category, filename);
    
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}/admin.html`);
});