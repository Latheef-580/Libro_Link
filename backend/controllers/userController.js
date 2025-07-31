const User = require('../models/User');
const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const bcrypt = require('bcryptjs');

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully', user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Cannot change password for deactivated account' });
    }
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Deactivate account
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is already deactivated' });
    }
    
    await user.deactivateAccount();
    
    res.json({ 
      message: 'Account deactivated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// Activate account
const activateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.isActive) {
      return res.status(400).json({ error: 'Account is already active' });
    }
    
    await user.activateAccount();
    
    res.json({ 
      message: 'Account activated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// Update reading preferences
const updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Preferences must be an object' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
  } catch (error) {
    next(error);
  }
};

// Get user dashboard data
const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Example stats (customize as needed)
    res.json({
      user: user.getPublicProfile(),
      stats: user.stats
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Confirmation is required' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Verify confirmation text is "DELETE"
    if (password !== 'DELETE') {
      return res.status(400).json({ error: 'Please type "DELETE" to confirm account deletion' });
    }
    
    // Delete user's books, wishlist items, and other related data
    await Book.deleteMany({ seller: user._id });
    await Wishlist.deleteMany({ user: user._id });
    
    // Delete the user account
    await User.findByIdAndDelete(user._id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get account status
const getAccountStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      isActive: user.isActive,
      accountStatus: user.accountStatus,
      deactivatedAt: user.deactivatedAt
    });
  } catch (error) {
    next(error);
  }
};

// Get user's activity summary (stub - customize as needed)
const getActivitySummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Example: return stats and recent activity (customize as needed)
    res.json({
      stats: user.stats,
      recentActivity: [] // Add logic for recent activity if needed
    });
  } catch (error) {
    next(error);
  }
};

// Get user favorites (wishlist)
const getFavorites = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id }).populate('book');
    res.json({ favorites: wishlist });
  } catch (error) {
    next(error);
  }
};

// Add to favorites (wishlist)
const addToWishlist = async (req, res, next) => {
  try {
    const { bookId, notes } = req.body;
    const exists = await Wishlist.findOne({ user: req.user._id, book: bookId });
    if (exists) return res.status(400).json({ error: 'Book already in wishlist' });
    const wishlistItem = new Wishlist({ user: req.user._id, book: bookId, notes });
    await wishlistItem.save();
    res.status(201).json({ message: 'Book added to wishlist', wishlistItem });
  } catch (error) {
    next(error);
  }
};

// Remove from favorites (wishlist)
const removeFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params; // wishlist item id
    const item = await Wishlist.findOneAndDelete({ _id: id, user: req.user._id });
    if (!item) return res.status(404).json({ error: 'Wishlist item not found' });
    res.json({ message: 'Book removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

// Get reading history
const getReadingHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Assume readingHistory is an array of book IDs
    const books = await Book.find({ _id: { $in: user.readingHistory || [] } });
    res.json({ history: books });
  } catch (error) {
    next(error);
  }
};

// Add to reading history
const addToReadingHistory = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.readingHistory = user.readingHistory || [];
    // Remove if already exists
    user.readingHistory = user.readingHistory.filter(id => id.toString() !== bookId);
    // Add to beginning
    user.readingHistory.unshift(bookId);
    // Keep only last 50
    user.readingHistory = user.readingHistory.slice(0, 50);
    await user.save();
    res.json({ message: 'Book added to reading history' });
  } catch (error) {
    next(error);
  }
};

// Add missing user controller stubs
const getUserById = async (req, res) => {
  res.json({ message: 'getUserById endpoint not yet implemented.' });
};

const getUserBooks = async (req, res) => {
  res.json({ message: 'getUserBooks endpoint not yet implemented.' });
};

const getUserReviews = async (req, res) => {
  res.json({ message: 'getUserReviews endpoint not yet implemented.' });
};

const addUserReview = async (req, res) => {
  res.json({ message: 'addUserReview endpoint not yet implemented.' });
};

const getRequests = async (req, res) => {
  res.json({ message: 'getRequests endpoint not yet implemented.' });
};

const getNotifications = async (req, res) => {
  res.json({ message: 'getNotifications endpoint not yet implemented.' });
};

const markNotificationRead = async (req, res) => {
  res.json({ message: 'markNotificationRead endpoint not yet implemented.' });
};

const markAllNotificationsRead = async (req, res) => {
  res.json({ message: 'markAllNotificationsRead endpoint not yet implemented.' });
};

const getConversations = async (req, res) => {
  res.json({ message: 'getConversations endpoint not yet implemented.' });
};

const getConversation = async (req, res) => {
  res.json({ message: 'getConversation endpoint not yet implemented.' });
};

const sendMessage = async (req, res) => {
  res.json({ message: 'sendMessage endpoint not yet implemented.' });
};

const markMessageRead = async (req, res) => {
  res.json({ message: 'markMessageRead endpoint not yet implemented.' });
};

const getWishlist = async (req, res) => {
  res.json({ message: 'getWishlist endpoint not yet implemented.' });
};

const updateWishlistItem = async (req, res) => {
  res.json({ message: 'updateWishlistItem endpoint not yet implemented.' });
};

const reportContent = async (req, res) => {
  res.json({ message: 'reportContent endpoint not yet implemented.' });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  activateAccount,
  updatePreferences,
  getDashboard,
  deleteAccount,
  getAccountStatus,
  getActivitySummary,
  getFavorites,
  addToWishlist,
  removeFromWishlist,
  getReadingHistory,
  addToReadingHistory,
  getUserById,
  getUserBooks,
  getUserReviews,
  addUserReview,
  getRequests,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getConversations,
  getConversation,
  sendMessage,
  markMessageRead,
  getWishlist,
  updateWishlistItem,
  reportContent
};