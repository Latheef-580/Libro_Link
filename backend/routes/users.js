// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for profile picture upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authMiddleware, userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put('/profile', authMiddleware, upload.single('profilePicture'), userController.updateProfile);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// GET /api/users/:id/books - Get books by user ID
router.get('/:id/books', userController.getUserBooks);

// GET /api/users/:id/reviews - Get reviews for user
router.get('/:id/reviews', userController.getUserReviews);

// POST /api/users/:id/review - Add review for user
router.post('/:id/review', authMiddleware, userController.addUserReview);

// GET /api/users/favorites - Get user favorites
router.get('/favorites', authMiddleware, userController.getFavorites);

// GET /api/users/requests - Get user requests
router.get('/requests', authMiddleware, userController.getRequests);

// GET /api/users/notifications - Get user notifications
router.get('/notifications', authMiddleware, userController.getNotifications);

// PUT /api/users/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authMiddleware, userController.markNotificationRead);

// PUT /api/users/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', authMiddleware, userController.markAllNotificationsRead);

// GET /api/users/messages - Get user messages/conversations
router.get('/messages', authMiddleware, userController.getConversations);

// GET /api/users/messages/:userId - Get conversation with specific user
router.get('/messages/:userId', authMiddleware, userController.getConversation);

// POST /api/users/messages - Send message
router.post('/messages', authMiddleware, userController.sendMessage);

// PUT /api/users/messages/:id/read - Mark message as read
router.put('/messages/:id/read', authMiddleware, userController.markMessageRead);

// GET /api/users/wishlist - Get user wishlist
router.get('/wishlist', authMiddleware, userController.getWishlist);

// POST /api/users/wishlist - Add item to wishlist
router.post('/wishlist', authMiddleware, userController.addToWishlist);

// PUT /api/users/wishlist/:id - Update wishlist item
router.put('/wishlist/:id', authMiddleware, userController.updateWishlistItem);

// DELETE /api/users/wishlist/:id - Remove item from wishlist
router.delete('/wishlist/:id', authMiddleware, userController.removeFromWishlist);

// POST /api/users/report - Report user or content
router.post('/report', authMiddleware, userController.reportContent);

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', authMiddleware, userController.updatePreferences);

// PUT /api/users/password - Change password
router.put('/password', authMiddleware, userController.changePassword);

// POST /api/users/deactivate - Deactivate account
router.post('/deactivate', authMiddleware, userController.deactivateAccount);

// POST /api/users/activate - Activate account
router.post('/activate', authMiddleware, userController.activateAccount);

// GET /api/users/account-status - Get account status
router.get('/account-status', authMiddleware, userController.getAccountStatus);

// DELETE /api/users/account - Delete user account
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;