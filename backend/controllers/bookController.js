const Book = require('../models/Book');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const sampleData = require('../../database/sampleData.json');

// Get all books with optional filtering and pagination
const getAllBooks = async (req, res, next) => {
  try {
    const { genre, author, search, page = 1, limit = 20, sortBy = 'title', sortOrder = 'asc' } = req.query;
    
    // Check if database is empty and seed with sample data
    const totalBooksInDB = await Book.countDocuments();
    if (totalBooksInDB === 0) {
      console.log('Database is empty, seeding with sample data...');
      await seedSampleData();
    }
    
    const query = {};
    if (genre) query.genre = genre;
    if (author) query.author = author;
    if (search) query.$text = { $search: search };
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const books = await Book.find(query)
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

// Get single book by ID
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('seller', 'username firstName lastName');
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    next(error);
  }
};

// Create new book
const createBook = async (req, res, next) => {
  try {
    const bookData = req.body;
    bookData.seller = req.user._id;
    const book = new Book(bookData);
    await book.save();
    res.status(201).json({ message: 'Book created successfully', book });
  } catch (error) {
    next(error);
  }
};

// Update book
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ error: 'Book not found or not authorized' });
    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    next(error);
  }
};

// Delete book
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!book) return res.status(404).json({ error: 'Book not found or not authorized' });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add book review
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    book.reviews.push({ user: req.user._id, rating, comment });
    // Recalculate average rating
    const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
    book.averageRating = totalRating / book.reviews.length;
    book.reviewCount = book.reviews.length;
    await book.save();
    res.json({ message: 'Review added', book });
  } catch (error) {
    next(error);
  }
};

// Get book recommendations for user
const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Recommend books from user's preferred genres not already in wishlist
    const wishlist = await Wishlist.find({ user: user._id });
    const wishlistBookIds = wishlist.map(item => String(item.book));
    const recommendations = await Book.find({
      genre: { $in: user.preferences.categories || [] },
      _id: { $nin: wishlistBookIds },
      status: 'available'
    }).limit(10);
    res.json({ recommendations, total: recommendations.length });
  } catch (error) {
    next(error);
  }
};

// Search books (stub)
const searchBooks = async (req, res) => {
  res.json({ message: 'Search books endpoint not yet implemented.' });
};

// Get featured books (stub)
const getFeaturedBooks = async (req, res) => {
  res.json({ message: 'Featured books endpoint not yet implemented.' });
};

// Get books by category (stub)
const getBooksByCategory = async (req, res) => {
  res.json({ message: 'Books by category endpoint not yet implemented.' });
};

// Get seller books (stub)
const getSellerBooks = async (req, res) => {
  res.json({ message: 'Seller books endpoint not yet implemented.' });
};

// Seed sample data function
const seedSampleData = async () => {
  try {
    console.log('Seeding sample data...');
    
    // Create a default seller user if it doesn't exist
    let defaultSeller = await User.findOne({ email: 'default-seller@librolink.com' });
    if (!defaultSeller) {
      defaultSeller = new User({
        firstName: 'Default',
        lastName: 'Seller',
        email: 'default-seller@librolink.com',
        password: 'defaultpassword123',
        username: 'defaultseller',
        accountType: 'seller',
        isActive: true,
        phone: '+1-555-000-0000',
        bio: 'Default seller for sample books'
      });
      await defaultSeller.save();
      console.log('Created default seller');
    }

    // Create sample books
    const books = [];
    for (let i = 0; i < sampleData.books.length; i++) {
      const bookData = sampleData.books[i];
      
      // Check if book already exists
      const existingBook = await Book.findOne({ title: bookData.title, author: bookData.author });
      if (existingBook) {
        console.log(`Book ${bookData.title} already exists, skipping...`);
        continue;
      }
      
      // Fix category mapping
      let category = bookData.category.toLowerCase();
      if (category === "children's books") {
        category = "children";
      }
      
      // Fix condition mapping
      let condition = bookData.condition.toLowerCase().replace(' ', '-');
      if (condition === 'fair') {
        condition = 'acceptable';
      } else if (condition === 'excellent') {
        condition = 'like-new';
      }
      
      const book = new Book({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        description: bookData.description,
        category: category,
        genre: bookData.genre,
        condition: condition,
        price: bookData.price,
        originalPrice: bookData.originalPrice,
        seller: defaultSeller._id,
        sellerName: defaultSeller.firstName + ' ' + defaultSeller.lastName,
        coverImage: bookData.coverImage,
        status: bookData.status,
        views: bookData.views,
        likes: Math.floor(Math.random() * 50),
        language: bookData.language,
        publisher: bookData.publisher,
        publishedYear: bookData.publicationYear,
        pages: bookData.pageCount,
        tags: bookData.tags,
        location: {
          city: bookData.location.split(',')[0],
          state: bookData.location.split(',')[1]?.trim() || 'Unknown',
          country: 'USA'
        },
        shipping: {
          free: Math.random() > 0.5,
          cost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 500),
          methods: bookData.shippingOptions
        },
        averageRating: bookData.averageRating,
        reviewCount: Math.floor(Math.random() * 20)
      });
      books.push(await book.save());
    }
    console.log(`Created ${books.length} sample books`);
    return books;
  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addReview,
  getRecommendations,
  searchBooks,
  getFeaturedBooks,
  getBooksByCategory,
  getSellerBooks,
  seedSampleData
};