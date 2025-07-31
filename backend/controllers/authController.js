// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d'
    });
};

// Register user
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        let { firstName, lastName, username, email, password, accountType } = req.body;
        email = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            username,
            email,
            password,
            accountType,
            status: 'active',
            verificationToken: crypto.randomBytes(32).toString('hex')
        });

        console.log('Saving user:', user);

        await user.save();

        console.log('User saved successfully:', user);

        // Generate token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = user.getPublicProfile();

        res.status(201).json({
            message: 'User registered successfully',
            user: userData,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error creating user account' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        let { email, password } = req.body;
        email = email.toLowerCase(); // Always lowercase email

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = user.getPublicProfile();

        res.json({
            message: 'Login successful',
            user: userData,
            token,
            accountStatus: {
                isActive: user.isActive,
                accountStatus: user.accountStatus,
                deactivatedAt: user.deactivatedAt
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const userData = req.user.getPublicProfile();
        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // In a more sophisticated setup, you might want to blacklist the token
        // For now, we'll just return success and let the client handle token removal
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // In a real application, you would send an email here

        res.json({ message: 'If the email exists, a reset link has been sent' });

    } catch (error) {
        res.status(500).json({ message: 'Error processing password reset request' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { token, password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error verifying email' });
    }
    
};