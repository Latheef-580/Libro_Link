
// backend/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true,
        maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    isbn: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['fiction', 'non-fiction', 'textbooks', 'mystery', 'romance', 'science', 'history', 'biography', 'children', 'other']
    },
    genre: {
        type: String,
        trim: true
    },
    language: {
        type: String,
        default: 'English'
    },
    publisher: String,
    publishedYear: {
        type: Number,
        min: [1000, 'Invalid publication year'],
        max: [new Date().getFullYear(), 'Publication year cannot be in the future']
    },
    pages: {
        type: Number,
        min: [1, 'Pages must be at least 1']
    },
    condition: {
        type: String,
        required: [true, 'Book condition is required'],
        enum: ['new', 'like-new', 'very-good', 'good', 'acceptable']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerName: String, // Denormalized for performance
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    coverImage: {
        type: String,
        default: '/assets/images/placeholder-book.jpg'
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved', 'pending', 'rejected'],
        default: 'available'
    },
    featured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    tags: [String],
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number
    },
    shipping: {
        free: { type: Boolean, default: false },
        cost: { type: Number, default: 0 },
        methods: [String]
    },
    location: {
        city: String,
        state: String,
        country: String,
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reservedUntil: Date,
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    soldDate: Date,
    soldPrice: Number,
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    lastViewedAt: Date,
    lastModified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for search optimization
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ seller: 1, status: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ featured: -1, createdAt: -1 });

// Virtual for discount percentage
bookSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round((1 - this.price / this.originalPrice) * 100);
    }
    return 0;
});

// Pre-save middleware
bookSchema.pre('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Methods
bookSchema.methods.incrementViews = function() {
    this.views += 1;
    this.lastViewedAt = new Date();
    return this.save();
};

bookSchema.methods.addReview = function(userId, rating, comment) {
    this.reviews.push({
        user: userId,
        rating,
        comment
    });
    
    // Recalculate average rating
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.reviewCount = this.reviews.length;
    
    return this.save();
};

bookSchema.methods.reserve = function(userId, duration = 24) {
    this.status = 'reserved';
    this.reservedBy = userId;
    this.reservedUntil = new Date(Date.now() + duration * 60 * 60 * 1000);
    return this.save();
};

bookSchema.methods.markAsSold = function(buyerId, soldPrice) {
    this.status = 'sold';
    this.soldTo = buyerId;
    this.soldDate = new Date();
    this.soldPrice = soldPrice || this.price;
    return this.save();
};

// Static methods
bookSchema.statics.getFeatured = function(limit = 8) {
    return this.find({ featured: true, status: 'available' })
        .populate('seller', 'username firstName lastName')
        .limit(limit)
        .sort({ createdAt: -1 });
};

bookSchema.statics.searchBooks = function(query, filters = {}) {
    const searchQuery = { status: 'available' };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    if (filters.category) {
        searchQuery.category = filters.category;
    }
    
    if (filters.minPrice || filters.maxPrice) {
        searchQuery.price = {};
        if (filters.minPrice) searchQuery.price.$gte = filters.minPrice;
        if (filters.maxPrice) searchQuery.price.$lte = filters.maxPrice;
    }
    
    if (filters.condition) {
        searchQuery.condition = filters.condition;
    }
    
    if (filters.location) {
        searchQuery['location.city'] = new RegExp(filters.location, 'i');
    }
    
    return this.find(searchQuery)
        .populate('seller', 'username firstName lastName')
        .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
};

module.exports = mongoose.model('Book', bookSchema);