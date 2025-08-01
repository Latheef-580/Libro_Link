const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Sample data route
app.get('/api/books/sample', (req, res) => {
    try {
        const sampleData = require('./database/sampleData.json');
        res.json(sampleData);
    } catch (error) {
        console.error('Error loading sample data:', error);
        res.status(500).json({ error: 'Failed to load sample data' });
    }
});

// Books API route (serves sample data)
app.get('/api/books', (req, res) => {
    try {
        const sampleData = require('./database/sampleData.json');
        res.json(sampleData);
    } catch (error) {
        console.error('Error loading books:', error);
        res.status(500).json({ error: 'Failed to load books' });
    }
});

// AI recommendations route (serves sample data as recommendations)
app.get('/api/ai/recommendations', (req, res) => {
    try {
        const sampleData = require('./database/sampleData.json');
        // Take first 6 books as recommendations
        const recommendations = sampleData.books.slice(0, 6);
        res.json({
            success: true,
            recommendations: recommendations
        });
    } catch (error) {
        console.error('Error loading AI recommendations:', error);
        res.status(500).json({ error: 'Failed to load recommendations' });
    }
});

// AI search autocomplete route
app.get('/api/ai/search/autocomplete', (req, res) => {
    try {
        const suggestions = [
            'Fiction',
            'Non-Fiction',
            'Textbooks',
            'Classic Literature',
            'Science Fiction',
            'Mystery',
            'Romance',
            'Programming',
            'Mathematics',
            'History'
        ];
        res.json({
            success: true,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('Error loading search suggestions:', error);
        res.status(500).json({ error: 'Failed to load suggestions' });
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

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.get('/books', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/books.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/profile.html'));
});

app.get('/wishlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/wishlist.html'));
});

app.get('/seller-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/seller-dashboard.html'));
});

app.get('/book-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/book-details.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/cart.html'));
});

app.listen(PORT, () => {
    console.log(`Simple server running on http://localhost:${PORT}`);
    console.log('Serving sample data for books and AI recommendations');
}).on('error', (error) => {
    console.error('Server error:', error);
}); 