// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Handle special admin case
    if (decoded.userId === 'admin' && decoded.isAdmin) {
      req.user = {
        _id: 'admin',
        username: 'admin',
        isAdmin: true,
        isActive: true
      };
      return next();
    }
    
    // Regular user authentication
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const checkAccountStatus = async (req, res, next) => {
  try {
    // This middleware should be used after authMiddleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if account is active
    if (!req.user.isActive) {
      return res.status(403).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support to reactivate your account.',
        accountStatus: 'deactivated',
        deactivatedAt: req.user.deactivatedAt
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking account status' });
  }
};

const adminMiddleware = (req, res, next) => {
    // For now, allow admin access for any authenticated user
    // In production, you should add an 'isAdmin' field to the User model
    if (req.user) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

const sellerMiddleware = (req, res, next) => {
    if (req.user && (req.user.userType === 'seller' || req.user.userType === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Seller access required' });
    }
};

module.exports = {
    authMiddleware,
    checkAccountStatus,
    adminMiddleware,
    sellerMiddleware
};