const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Sample data route
app.get('/api/books/sample', (req, res) => {
    try {
        const sampleData = require('../database/sampleData.json');
        res.json(sampleData);
    } catch (error) {
        console.error('Error loading sample data:', error);
        res.status(500).json({ error: 'Failed to load sample data' });
    }
});

// Books API route (fallback to sample data)
app.get('/api/books', (req, res) => {
    try {
        const sampleData = require('../database/sampleData.json');
        res.json(sampleData);
    } catch (error) {
        console.error('Error loading books:', error);
        res.status(500).json({ error: 'Failed to load books' });
    }
});

// Admin login route
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            message: 'Admin login successful',
            token: 'test-token',
            user: { username: 'admin', isAdmin: true }
        });
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
});

// Dashboard stats route
app.get('/api/admin/dashboard/stats', (req, res) => {
    res.json({
        users: {
            total: 150,
            active: 120,
            inactive: 30,
            newThisMonth: 25,
            newThisWeek: 8
        },
        books: {
            total: 500,
            available: 350,
            sold: 120,
            reserved: 30,
            newThisMonth: 45
        },
        revenue: {
            total: 150000,
            thisMonth: 25000,
            thisWeek: 8000,
            averagePrice: 1250
        },
        reviews: {
            total: 320,
            averageRating: 4.2,
            thisMonth: 45
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (error) => {
    console.error('Server error:', error);
}); 