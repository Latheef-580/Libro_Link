// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'self'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"]
        }
    }
}));

// CORS configuration for production
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://librolink.onrender.com', 'https://librolink-production.up.railway.app']
        : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3001'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/librolink';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));

// Serve static files from frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    // Admin seed route for production
    app.get('/admin-seed', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/admin-seed.html'));
    });
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
    });
} else {
    // Development: serve frontend files
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    // Serve HTML files
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
    
    app.get('/books', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/books.html'));
    });
    
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });
    
    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/register.html'));
    });
    
    app.get('/profile', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/profile.html'));
    });
    
    app.get('/wishlist', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/wishlist.html'));
    });
    
    app.get('/seller-dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/seller-dashboard.html'));
    });
    
    app.get('/book-details/:id', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/book-details.html'));
    });
    
    app.get('/admin-seed', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/admin-seed.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Start server
const startServer = async () => {
    await connectDB();
    
    // Auto-seed database if empty (only in production)
    if (process.env.NODE_ENV === 'production') {
        try {
            const Book = require('./models/Book');
            const bookCount = await Book.countDocuments();
            if (bookCount === 0) {
                console.log('Database is empty, auto-seeding with sample data...');
                const { seedSampleData } = require('./controllers/bookController');
                await seedSampleData();
                console.log('Auto-seeding completed successfully');
            } else {
                console.log(`Database already has ${bookCount} books`);
            }
        } catch (error) {
            console.error('Error during auto-seeding:', error);
        }
    }
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();