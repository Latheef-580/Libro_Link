// backend/routes/books.js
const express = require('express');
const { body, query } = require('express-validator');
const bookController = require('../controllers/bookController');
const { authMiddleware, sellerMiddleware } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Development route to serve sample data directly
router.get('/sample', (req, res) => {
    try {
        const sampleData = require('../../database/sampleData.json');
        res.json(sampleData);
    } catch (error) {
        console.error('Error loading sample data:', error);
        res.status(500).json({ error: 'Failed to load sample data' });
    }
});

// Get all books with filtering and pagination
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isString(),
    query('genre').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('condition').optional().isIn(['Like New', 'Very Good', 'Good', 'Fair']),
    query('search').optional().isString()
], bookController.getAllBooks);

// Get single book by ID
router.get('/:id', bookController.getBookById);

// Create new book (sellers only)
router.post('/', authMiddleware, sellerMiddleware, [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('author').notEmpty().trim().withMessage('Author is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('condition').isIn(['Like New', 'Very Good', 'Good', 'Fair']).withMessage('Invalid condition'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').notEmpty().isLength({ max: 1000 }).withMessage('Description is required and must be under 1000 characters'),
    body('category').isIn(['Fiction', 'Non-Fiction', 'Textbooks', 'Children\'s Books']).withMessage('Invalid category'),
    body('isbn').optional().isISBN(),
    body('pageCount').optional().isInt({ min: 1 }),
    body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 })
], bookController.createBook);

// Update book (owner only)
router.put('/:id', authMiddleware, sellerMiddleware, [
    body('title').optional().notEmpty().trim(),
    body('author').optional().notEmpty().trim(),
    body('genre').optional().notEmpty(),
    body('condition').optional().isIn(['Like New', 'Very Good', 'Good', 'Fair']),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional().notEmpty().isLength({ max: 1000 }),
    body('category').optional().isIn(['Fiction', 'Non-Fiction', 'Textbooks', 'Children\'s Books']),
    body('isbn').optional().isISBN(),
    body('pageCount').optional().isInt({ min: 1 }),
    body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 })
], bookController.updateBook);

// Delete book (owner only)
router.delete('/:id', authMiddleware, sellerMiddleware, bookController.deleteBook);

// Add book review
router.post('/:id/reviews', authMiddleware, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment must be under 500 characters')
], bookController.addReview);

// Get book recommendations
router.get('/:id/recommendations', bookController.getRecommendations);

// Search books
router.get('/search/:query', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], bookController.searchBooks);

// Get featured books
router.get('/featured/list', bookController.getFeaturedBooks);

// Get books by category
router.get('/category/:category', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], bookController.getBooksByCategory);

// Get seller's books
router.get('/seller/:sellerId', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], bookController.getSellerBooks);

module.exports = router;