// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: '/assets/images/default-avatar.png'
  },
  accountType: {
    type: String,
    enum: ['buyer', 'seller', 'both'],
    default: 'buyer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date
  },
  preferences: {
    notifications: {
      orderUpdates: { type: Boolean, default: true },
      newBooks: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    }
  },
  stats: {
    booksOwned: { type: Number, default: 0 },
    booksSold: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now }
  },
  
  // AI and Recommendation fields
  aiProfile: {
    readingPreferences: [{
      category: String,
      weight: { type: Number, default: 1.0 }
    }],
    favoriteAuthors: [String],
    favoriteGenres: [String],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10000 }
    },
    readingLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  
  // User behavior tracking for AI
  behavior: {
    searchHistory: [{
      query: String,
      timestamp: { type: Date, default: Date.now },
      results: [String] // Book IDs
    }],
    viewHistory: [{
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      timestamp: { type: Date, default: Date.now },
      duration: Number // seconds spent viewing
    }],
    purchaseHistory: [{
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      timestamp: { type: Date, default: Date.now },
      price: Number
    }],
    wishlistItems: [{
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      addedAt: { type: Date, default: Date.now }
    }],
    ratings: [{
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  // AI Analytics
  analytics: {
    churnRisk: { type: Number, default: 0.5 }, // 0-1 scale
    lifetimeValue: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 }
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'upi', 'netbanking'],
      required: true
    },
    cardNumber: String,
    cardHolderName: String,
    expiryDate: String,
    cvv: String,
    upiId: String,
    bankName: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account status
userSchema.virtual('accountStatus').get(function() {
  if (!this.isActive) {
    return 'deactivated';
  }
  return 'active';
});

// Method to check if account is active
userSchema.methods.isAccountActive = function() {
  return this.isActive;
};

// Method to deactivate account
userSchema.methods.deactivateAccount = function() {
  this.isActive = false;
  this.deactivatedAt = new Date();
  return this.save();
};

// Method to activate account
userSchema.methods.activateAccount = function() {
  this.isActive = true;
  this.deactivatedAt = undefined;
  return this.save();
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);