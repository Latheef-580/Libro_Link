// backend/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('username')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
        .isAlphanumeric().withMessage('Username must contain only letters and numbers'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('accountType').notEmpty().withMessage('Account type is required'),
    // ... any other fields you require
], authController.register);

// Login
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .exists()
        .withMessage('Password is required')
], authController.login);

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', authMiddleware, authController.logout);

// Forgot password
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
], authController.forgotPassword);

// Reset password
router.post('/reset-password', [
    body('token')
        .exists()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], authController.resetPassword);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;