const User = require('../models/User');
const Book = require('../models/Book');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin login
const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Simple admin check (in production, you should have admin users in the database)
    if ((username === 'admin' || username === 'Admin') && password === 'admin123') {
      // Create a simple admin token
      const adminToken = jwt.sign(
        { userId: 'admin', isAdmin: true },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        message: 'Admin login successful',
        token: adminToken,
        user: { username: 'admin', isAdmin: true }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    next(error);
  }
};

// Get comprehensive admin dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    // User Statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // User Type Distribution
    const userTypeStats = await User.aggregate([
      { $group: { _id: '$accountType', count: { $sum: 1 } } }
    ]);

    // Book Statistics
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ status: 'available' });
    const soldBooks = await Book.countDocuments({ status: 'sold' });
    const reservedBooks = await Book.countDocuments({ status: 'reserved' });
    const newBooksThisMonth = await Book.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Revenue Statistics
    const revenueStats = await Book.aggregate([
      { $match: { status: 'sold' } },
      { $group: { _id: null, totalRevenue: { $sum: '$soldPrice' }, avgPrice: { $avg: '$soldPrice' } } }
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const avgBookPrice = revenueStats.length > 0 ? revenueStats[0].avgPrice : 0;

    // Category and Genre Distribution
    const categoryDistribution = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const genreDistribution = await Book.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top Selling Books
    const topSellingBooks = await Book.find({ status: 'sold' })
      .sort({ soldDate: -1 })
      .limit(5)
      .populate('seller', 'firstName lastName username')
      .populate('soldTo', 'firstName lastName username');

    // Most Viewed Books
    const mostViewedBooks = await Book.find({ status: 'available' })
      .sort({ views: -1 })
      .limit(5)
      .populate('seller', 'firstName lastName username');

    // Recent Activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName username email createdAt accountType isActive');

    const recentBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('seller', 'firstName lastName username')
      .select('title author price status createdAt');

    // Reviews and Ratings
    const reviewStats = await Book.aggregate([
      { $unwind: '$reviews' },
      { $group: { _id: null, totalReviews: { $sum: 1 }, avgRating: { $avg: '$reviews.rating' } } }
    ]);

    const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;
    const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 0;

    // Monthly Growth Data
    const monthlyData = await Promise.all([
      // Last 6 months user growth
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Last 6 months book growth
      Book.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Last 6 months revenue
      Book.aggregate([
        {
          $match: {
            soldDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
            status: 'sold'
          }
        },
        {
          $group: {
            _id: { year: { $year: '$soldDate' }, month: { $month: '$soldDate' } },
            revenue: { $sum: '$soldPrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        typeDistribution: userTypeStats
      },
      books: {
        total: totalBooks,
        available: availableBooks,
        sold: soldBooks,
        reserved: reservedBooks,
        newThisMonth: newBooksThisMonth,
        categoryDistribution,
        genreDistribution
      },
      revenue: {
        total: totalRevenue,
        averagePrice: avgBookPrice,
        totalSales: soldBooks
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating
      },
      activity: {
        recentUsers,
        recentBooks,
        topSellingBooks,
        mostViewedBooks
      },
      analytics: {
        monthlyUserGrowth: monthlyData[0],
        monthlyBookGrowth: monthlyData[1],
        monthlyRevenue: monthlyData[2]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users with comprehensive data
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc', status = 'all', accountType = 'all' } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Account type filter
    if (accountType !== 'all') {
      query.accountType = accountType;
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    const totalUsers = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userStats = await Book.aggregate([
        { $match: { seller: user._id } },
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            soldBooks: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, '$soldPrice', 0] } }
          }
        }
      ]);

      const stats = userStats.length > 0 ? userStats[0] : { totalBooks: 0, soldBooks: 0, totalRevenue: 0 };

      return {
        ...user.toObject(),
        stats
      };
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        usersPerPage: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID with detailed information
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's books
    const userBooks = await Book.find({ seller: user._id })
      .populate('soldTo', 'firstName lastName username')
      .sort({ createdAt: -1 });

    // Get user's purchase history (books they bought)
    const purchasedBooks = await Book.find({ soldTo: user._id })
      .populate('seller', 'firstName lastName username')
      .sort({ soldDate: -1 });

    // Get user's reviews
    const userReviews = await Book.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.user': user._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $project: {
          bookTitle: '$title',
          bookId: '$_id',
          rating: '$reviews.rating',
          comment: '$reviews.comment',
          date: '$reviews.date',
          sellerName: { $concat: ['$seller.firstName', ' ', '$seller.lastName'] }
        }
      }
    ]);

    // Calculate user statistics
    const stats = await Book.aggregate([
      { $match: { seller: user._id } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          soldBooks: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
          availableBooks: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, '$soldPrice', 0] } },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);

    const userStats = stats.length > 0 ? stats[0] : {
      totalBooks: 0,
      soldBooks: 0,
      availableBooks: 0,
      totalRevenue: 0,
      totalViews: 0,
      totalLikes: 0
    };

    res.json({
      user: {
        ...user.toObject(),
        stats: userStats,
        books: userBooks,
        purchasedBooks,
        reviews: userReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new user (admin only)
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, accountType = 'buyer', phone, bio } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      accountType,
      phone,
      bio
    });

    await newUser.save();
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser.getPublicProfile() 
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only)
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    const user = await User.findByIdAndUpdate(userId, updates, { 
      new: true, 
      runValidators: true 
    }).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      message: 'User updated successfully', 
      user: user.getPublicProfile() 
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Delete user's books first
    await Book.deleteMany({ seller: userId });
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'User and associated books deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get all books for admin management with comprehensive data
const getAllBooksAdmin = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      status = '',
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (status) query.status = status;

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const books = await Book.find(query)
      .populate('seller', 'firstName lastName username email')
      .populate('soldTo', 'firstName lastName username')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalBooks = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalBooks / limit),
        totalBooks,
        booksPerPage: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new book
const createBook = async (req, res, next) => {
  try {
    const bookData = req.body;
    const book = new Book(bookData);
    await book.save();
    
    const populatedBook = await Book.findById(book._id)
      .populate('seller', 'firstName lastName username');
    
    res.status(201).json({ 
      message: 'Book created successfully', 
      book: populatedBook 
    });
  } catch (error) {
    next(error);
  }
};

// Update book
const updateBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findByIdAndUpdate(bookId, req.body, { 
      new: true, 
      runValidators: true 
    }).populate('seller', 'firstName lastName username');
    
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json({ 
      message: 'Book updated successfully', 
      book 
    });
  } catch (error) {
    next(error);
  }
};

// Delete book
const deleteBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findByIdAndDelete(bookId);
    
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get comprehensive analytics
const getAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
        break;
      default:
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }

    // User Analytics
    const userAnalytics = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Book Analytics
    const bookAnalytics = await Book.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Revenue Analytics
    const revenueAnalytics = await Book.aggregate([
      { 
        $match: { 
          soldDate: dateFilter,
          status: 'sold'
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$soldDate' },
            month: { $month: '$soldDate' },
            day: { $dayOfMonth: '$soldDate' }
          },
          revenue: { $sum: '$soldPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top Categories
    const topCategories = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top Sellers
    const topSellers = await Book.aggregate([
      { $match: { status: 'sold' } },
      {
        $group: {
          _id: '$seller',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$soldPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $project: {
          sellerName: { $concat: ['$sellerInfo.firstName', ' ', '$sellerInfo.lastName'] },
          sellerEmail: '$sellerInfo.email',
          totalSales: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Review Analytics
    const reviewAnalytics = await Book.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.date': dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$reviews.date' },
            month: { $month: '$reviews.date' },
            day: { $dayOfMonth: '$reviews.date' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$reviews.rating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period,
      userAnalytics,
      bookAnalytics,
      revenueAnalytics,
      reviewAnalytics,
      topCategories,
      topSellers
    });
  } catch (error) {
    next(error);
  }
};

// Get all reviews for admin
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const reviews = await Book.aggregate([
      { $unwind: '$reviews' },
      {
        $lookup: {
          from: 'users',
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewer'
        }
      },
      { $unwind: '$reviewer' },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $project: {
          bookTitle: '$title',
          bookId: '$_id',
          rating: '$reviews.rating',
          comment: '$reviews.comment',
          reviewDate: '$reviews.date',
          reviewerName: { $concat: ['$reviewer.firstName', ' ', '$reviewer.lastName'] },
          reviewerEmail: '$reviewer.email',
          sellerName: { $concat: ['$seller.firstName', ' ', '$seller.lastName'] },
          sellerEmail: '$seller.email'
        }
      },
      { $sort: { reviewDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    ]);

    const totalReviews = await Book.aggregate([
      { $unwind: '$reviews' },
      { $count: 'total' }
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil((totalReviews[0]?.total || 0) / limit),
        totalReviews: totalReviews[0]?.total || 0,
        reviewsPerPage: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllBooksAdmin,
  createBook,
  updateBook,
  deleteBook,
  getAnalytics,
  getAllReviews
};