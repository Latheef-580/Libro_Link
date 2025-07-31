// backend/models/Wishlist.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    priceAlert: {
        enabled: { type: Boolean, default: false },
        targetPrice: { type: Number, min: 0 }
    },
    notified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure uniqueness and optimize queries
wishlistSchema.index({ user: 1, book: 1 }, { unique: true });
wishlistSchema.index({ user: 1, addedAt: -1 });

// Static methods
wishlistSchema.statics.getUserWishlist = function(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return this.find({ user: userId })
        .populate({
            path: 'book',
            match: { status: { $ne: 'sold' } }, // Only show available books
            populate: {
                path: 'seller',
                select: 'username firstName lastName'
            }
        })
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(limit);
};

wishlistSchema.statics.addToWishlist = async function(userId, bookId, notes = '') {
    try {
        const wishlistItem = new this({
            user: userId,
            book: bookId,
            notes
        });
        
        return await wishlistItem.save();
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Book is already in wishlist');
        }
        throw error;
    }
};

wishlistSchema.statics.removeFromWishlist = function(userId, bookId) {
    return this.findOneAndDelete({ user: userId, book: bookId });
};

wishlistSchema.statics.isInWishlist = async function(userId, bookId) {
    const item = await this.findOne({ user: userId, book: bookId });
    return !!item;
};

wishlistSchema.statics.getWishlistCount = function(userId) {
    return this.countDocuments({ user: userId });
};

// Get books with price alerts
wishlistSchema.statics.getBooksWithPriceAlerts = function() {
    return this.find({ 
        'priceAlert.enabled': true,
        notified: false
    }).populate('book user');
};

// Methods
wishlistSchema.methods.setPriceAlert = function(targetPrice) {
    this.priceAlert.enabled = true;
    this.priceAlert.targetPrice = targetPrice;
    this.notified = false;
    return this.save();
};

wishlistSchema.methods.disablePriceAlert = function() {
    this.priceAlert.enabled = false;
    this.notified = false;
    return this.save();
};

wishlistSchema.methods.markAsNotified = function() {
    this.notified = true;
    return this.save();
};

module.exports = mongoose.model('Wishlist', wishlistSchema);