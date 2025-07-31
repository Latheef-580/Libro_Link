const express = require('express');
const adminController = require('../controllers/adminController');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Admin authentication (no middleware required)
router.post('/login', adminController.adminLogin);

// All other routes should be protected by auth and admin middleware
router.use(authMiddleware, adminMiddleware);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Book management
router.get('/books', adminController.getAllBooksAdmin);
router.post('/books', adminController.createBook);
router.put('/books/:bookId', adminController.updateBook);
router.delete('/books/:bookId', adminController.deleteBook);

// Reviews management
router.get('/reviews', adminController.getAllReviews);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
