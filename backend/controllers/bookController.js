const Book = require('../models/Book');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');

// Get all books with optional filtering and pagination
const getAllBooks = async (req, res, next) => {
  try {
    const { genre, author, search, page = 1, limit = 20, sortBy = 'title', sortOrder = 'asc' } = req.query;
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
  getSellerBooks
};