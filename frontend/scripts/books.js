// books.js - Books page functionality

import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';

class BooksManager {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.currentPage = 1;
        this.booksPerPage = 12; // Show 12 books per page
        this.currentFilters = {
            category: [],
            condition: [],
            language: [],
            priceRange: 500,
            sortBy: 'newest'
        };
        this.currentView = 'grid';
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.loadBooks().then(() => {
            this.handleSearchFromURL();
            // Setup pagination after URL parameters are processed
            this.setupPagination();
        });
        this.setupEventListeners();
        this.setupFilters();
        
        // Debug: Check wishlist manager availability
        setTimeout(() => {
            console.log('[Books] After 2s - window.wishlistManager available:', !!window.wishlistManager);
            if (window.wishlistManager) {
                console.log('[Books] Wishlist manager found:', window.wishlistManager);
                console.log('[Books] Wishlist manager currentUser:', window.wishlistManager.currentUser);
            } else {
                console.log('[Books] Wishlist manager not available - this might cause issues');
            }
        }, 2000);
    }

    checkAuthStatus() {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.currentUser = user;
    }

    getUserSpecificKey(key) {
        if (!this.currentUser) return key;
        const userKey = `${key}_${this.currentUser.id || this.currentUser._id || this.currentUser.email}`;
        console.log('[Books] getUserSpecificKey:', key, '->', userKey, 'for user:', this.currentUser);
        return userKey;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Clear filters
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }

        // Modal functionality
        this.setupModalEvents();
    }

    setupFilters() {
        // Category filters
        const categoryInputs = document.querySelectorAll('input[name="category"]');
        categoryInputs.forEach(input => {
            input.addEventListener('change', () => this.updateFilters());
        });

        // Condition filters
        const conditionInputs = document.querySelectorAll('input[name="condition"]');
        conditionInputs.forEach(input => {
            input.addEventListener('change', () => this.updateFilters());
        });

        // Language filters
        const languageInputs = document.querySelectorAll('input[name="language"]');
        languageInputs.forEach(input => {
            input.addEventListener('change', () => this.updateFilters());
        });

        // Price range dropdown
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) {
            priceRangeSelect.addEventListener('change', (e) => {
                this.currentFilters.priceRange = e.target.value;
                this.applyFilters();
            });
        }
    }

    setupModalEvents() {
        const modal = document.getElementById('bookModal');
        const closeBtn = modal?.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Wishlist and cart buttons
        const addToWishlistBtn = document.getElementById('addToWishlistBtn');
        const addToCartBtn = document.getElementById('addToCartBtn');

        if (addToWishlistBtn) {
            addToWishlistBtn.addEventListener('click', () => this.addToWishlist());
        }

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }
    }

    async loadBooks() {
        // Fetch books from API
        let sampleDataBooks = [];
        try {
            const response = await fetch('/api/books');
            const data = await response.json();
            sampleDataBooks = Array.isArray(data.books) ? data.books : [];
        } catch (e) {
            console.log('[Books] Main API failed, trying sample data route...');
            try {
                const sampleResponse = await fetch('/api/books/sample');
                const sampleData = await sampleResponse.json();
                sampleDataBooks = Array.isArray(sampleData.books) ? sampleData.books : [];
                console.log('[Books] Loaded books from sample data:', sampleDataBooks.length);
            } catch (sampleError) {
                console.log('[Books] Sample data route also failed:', sampleError);
                sampleDataBooks = [];
            }
        }

        // Fetch books from global_books in localStorage
        const globalBooksKey = 'global_books';
        let globalBooks = JSON.parse(localStorage.getItem(globalBooksKey) || '[]');

        // Combine both arrays and remove duplicates by id
        const allBooks = [...sampleDataBooks, ...globalBooks];
        const seenIds = new Set();
        const uniqueBooks = allBooks.filter(book => {
            const bookId = String(book.id || book._id);
            if (seenIds.has(bookId)) return false;
            seenIds.add(bookId);
            return true;
        });

        this.books = uniqueBooks;
        this.filteredBooks = [...this.books];
        
        // Debug: Log all books and their prices
        console.log('[Books] All loaded books:', this.books.length);
        this.books.forEach(book => {
            if (Number(book.price) === 1999) {
                console.log('[Books] Found book with price 1999:', book.title, 'Price:', book.price, 'Type:', typeof book.price);
            }
        });
        
        this.renderBooks();
        this.updateResultsCount();
        this.renderPagination();
        // On load, set currentPage from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam && !isNaN(Number(pageParam))) {
            this.currentPage = Number(pageParam);
        }
    }

    async fetchBooks() {
        let sampleDataBooks = [];
        try {
            const response = await fetch('/api/books');
            const data = await response.json();
            sampleDataBooks = (data.books || []).map(book => ({
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                originalPrice: book.originalPrice,
                condition: (book.condition || '').toLowerCase().replace(' ', '-'),
                category: (book.category || '').toLowerCase().replace(/[^a-z]/g, ''),
                language: (book.language || '').toLowerCase(),
                image: book.coverImage,
                rating: book.averageRating || 0,
                reviews: book.views || 0,
                seller: book.sellerName,
                description: book.description,
                isbn: book.isbn,
                availability: book.status === 'available' ? 'available' : 'out-of-stock',
                dateAdded: new Date(2024, 0, 1)
            }));
        } catch (e) {
            sampleDataBooks = [];
        }

        // Always include hardcoded books
        const hardcodedBooks = this.generateSampleBooks ? this.generateSampleBooks() : [];

        // Combine both arrays and remove duplicates by id
        const allBooks = [...sampleDataBooks, ...hardcodedBooks];
        const seenIds = new Set();
        const uniqueBooks = allBooks.filter(book => {
            const bookId = String(book.id || book._id);
            if (seenIds.has(bookId)) return false;
            seenIds.add(bookId);
            return true;
        });

        // Sort by id
        uniqueBooks.sort((a, b) => Number(a.id) - Number(b.id));
        return uniqueBooks;
    }

    generateSampleBooks() {
        return [
            {
                id: 1,
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                price: 1299.99,
                originalPrice: 1599.99,
                condition: "good",
                category: "fiction",
                language: "english",
                image: "/assets/images/great-gatsby.jpg",
                rating: 4.5,
                reviews: 156,
                seller: "BookLover123",
                description: "A classic American novel set in the summer of 1922...",
                isbn: "978-0-7432-7356-5",
                availability: "available",
                dateAdded: new Date('2024-01-15')
            },
            {
                id: 2,
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                price: 1899.50,
                originalPrice: 2199.99,
                condition: "like-new",
                category: "fiction",
                language: "english",
                image: "/assets/images/mockingbird.jpg",
                rating: 4.8,
                reviews: 203,
                seller: "ClassicBooks",
                description: "A gripping tale of racial injustice and childhood innocence...",
                isbn: "978-0-06-112008-4",
                availability: "available",
                dateAdded: new Date('2024-01-20')
            },
            {
                id: 9,
                title: "JavaScript: The Good Parts",
                author: "Douglas Crockford",
                price: 1600.00,
                originalPrice: 1900.00,
                condition: "fair",
                category: "textbooks",
                language: "english",
                image: "/assets/images/javascript.jpg",
                rating: 4.2,
                reviews: 89,
                seller: "TechBooks2024",
                description: "Essential JavaScript concepts and best practices...",
                isbn: "978-0-596-51774-8",
                availability: "available",
                dateAdded: new Date('2024-01-25')
            },
            {
                id: 10,
                title: "Dune",
                author: "Frank Herbert",
                price: 2499.99,
                originalPrice: 2999.99,
                condition: "new",
                category: "sci-fi",
                language: "english",
                image: "/assets/images/dune.jpg",
                rating: 4.7,
                reviews: 342,
                seller: "SciFiWorld",
                description: "Epic science fiction novel set on the desert planet Arrakis...",
                isbn: "978-0-441-17271-9",
                availability: "available",
                dateAdded: new Date('2024-02-01')
            },
            {
                id: 11,
                title: "Pride and Prejudice",
                author: "Jane Austen",
                price: 1489.75,
                originalPrice: 1699.99,
                condition: "good",
                category: "romance",
                language: "english",
                image: "/assets/images/pride-and-prejudice.jpg",
                rating: 4.6,
                reviews: 278,
                seller: "RomanceReads",
                description: "Classic romance novel about Elizabeth Bennet and Mr. Darcy...",
                isbn: "978-0-14-143951-8",
                availability: "out-of-stock",
                dateAdded: new Date('2024-02-05')
            },
            {
                id: 12,
                title: "The Girl with the Dragon Tattoo",
                author: "Stieg Larsson",
                price: 1699.99,
                originalPrice: 1999.99,
                condition: "like-new",
                category: "mystery",
                language: "english",
                image: "/assets/images/the-girl-with-the-dragon-tattoo.jpg",
                rating: 4.4,
                reviews: 187,
                seller: "MysteryMania",
                description: "Swedish crime thriller featuring journalist Mikael Blomkvist...",
                isbn: "978-0-307-47347-1",
                availability: "available",
                dateAdded: new Date('2024-02-10')
            },
            {
                id: 13,
                title: "1984",
                author: "George Orwell",
                price: 1499.99,
                originalPrice: 1799.99,
                condition: "new",
                category: "fiction",
                language: "english",
                image: "/assets/images/1984.jpg",
                rating: 4.8,
                reviews: 512,
                seller: "ClassicReads",
                description: "Dystopian novel set in a totalitarian society under constant surveillance...",
                isbn: "978-0-452-28423-4",
                availability: "available",
                dateAdded: new Date('2024-02-15')
            },
            {
                id: 14,
                title: "Clean Code",
                author: "Robert C. Martin",
                price: 4200.99,
                originalPrice: 4999.99,
                condition: "like-new",
                category: "textbooks",
                language: "english",
                image: "/assets/images/clean-code.jpg",
                description: "A Handbook of Agile Software Craftsmanship",
                isbn: "978-0-13-235088-4",
                reviews: 320,
                rating: 4.7,
                seller: "TechBooks2024",
                availability: "available",
                dateAdded: new Date('2024-02-20')
            },
            {
                id: 15,
                title: "The Catcher in the Rye",
                author: "J.D. Salinger",
                price: 1699.50,
                originalPrice: 1999.99,
                condition: "good",
                category: "fiction",
                language: "english",
                image: "/assets/images/the-catcher.jpg",
                description: "A story about teenage angst and alienation, narrated by Holden Caulfield.",
                isbn: "978-0-316-76948-0",
                rating: 4.5,
                reviews: 250,
                seller: "LiteraryClassics",
                availability: "available",
                dateAdded: new Date('2024-02-25')
            },
            {
                id: 16,
                title: "Design Patterns",
                author: "Gang of Four",
                price: 2454.99,
                originalPrice: 2999.99,
                condition: "fair",
                category: "textbooks",
                language: "english",
                image: "/assets/images/design-patterns.jpg",
                description: "Elements of Reusable Object-Oriented Software",
                isbn: "978-0-201-63361-0",
                rating: 4.6,
                reviews: 410,
                seller: "TechBooks2024",
                availability: "available",
                dateAdded: new Date('2024-03-01')
            }
        ];
    }

    updateFilters() {
        // Update category filters
        this.currentFilters.category = Array.from(
            document.querySelectorAll('input[name="category"]:checked')
        ).map(input => input.value);

        // Update condition filters
        this.currentFilters.condition = Array.from(
            document.querySelectorAll('input[name="condition"]:checked')
        ).map(input => input.value);

        // Update language filters
        this.currentFilters.language = Array.from(
            document.querySelectorAll('input[name="language"]:checked')
        ).map(input => input.value);

        this.applyFilters();
    }

    async refreshBooksFromStorage() {
        // Fetch books from API
        let sampleDataBooks = [];
        try {
            const response = await fetch('/api/books');
            const data = await response.json();
            sampleDataBooks = Array.isArray(data.books) ? data.books : [];
        } catch (e) {
            console.log('[Books] Main API failed during refresh, trying sample data route...');
            try {
                const sampleResponse = await fetch('/api/books/sample');
                const sampleData = await sampleResponse.json();
                sampleDataBooks = Array.isArray(sampleData.books) ? sampleData.books : [];
                console.log('[Books] Refreshed books from sample data:', sampleDataBooks.length);
            } catch (sampleError) {
                console.log('[Books] Sample data route also failed during refresh:', sampleError);
                sampleDataBooks = [];
            }
        }
        // Fetch books from global_books in localStorage
        const globalBooksKey = 'global_books';
        let globalBooks = JSON.parse(localStorage.getItem(globalBooksKey) || '[]');
        // Combine both arrays and remove duplicates by id
        const allBooks = [...sampleDataBooks, ...globalBooks];
        const seenIds = new Set();
        const uniqueBooks = allBooks.filter(book => {
            const bookId = String(book.id || book._id);
            if (seenIds.has(bookId)) return false;
            seenIds.add(bookId);
            return true;
        });
        this.books = uniqueBooks;
        
        // Debug: Log books after refresh
        console.log('[Books] Books after refresh:', this.books.length);
        this.books.forEach(book => {
            if (Number(book.price) === 1999) {
                console.log('[Books] After refresh - Book with price 1999:', book.title, 'Price:', book.price, 'Type:', typeof book.price);
            }
        });
    }

    async applyFilters() {
        // Always refresh books from storage before filtering
        await this.refreshBooksFromStorage();
        let filtered = [...this.books];

        // Category filter
        if (this.currentFilters.category && this.currentFilters.category.length > 0) {
            const selectedCategories = this.currentFilters.category.map(cat => cat.trim().toLowerCase());
            filtered = filtered.filter(book => {
                const bookCategory = (book.category || '').trim().toLowerCase();
                return selectedCategories.includes(bookCategory);
            });
        }

        // Condition filter
        if (this.currentFilters.condition && this.currentFilters.condition.length > 0) {
            filtered = filtered.filter(book => {
                const bookCondition = (book.condition || '').toLowerCase().replace(/\s+/g, '-');
                return this.currentFilters.condition.some(filterCondition => 
                    bookCondition === filterCondition.toLowerCase().replace(/\s+/g, '-')
                );
            });
        }

        // Language filter
        if (this.currentFilters.language && this.currentFilters.language.length > 0) {
            filtered = filtered.filter(book => {
                const bookLanguage = (book.language || '').toLowerCase();
                return this.currentFilters.language.some(filterLanguage => 
                    bookLanguage === filterLanguage.toLowerCase()
                );
            });
        }

        // Price range filter
        const range = this.currentFilters.priceRange;
        console.log('[Books] Current price range filter:', range);
        if (range && range !== 'all') {
            if (range === '0-500') {
                filtered = filtered.filter(book => Number(book.price) >= 0 && Number(book.price) <= 500);
            } else if (range === '501-1000') {
                filtered = filtered.filter(book => Number(book.price) >= 501 && Number(book.price) <= 1000);
            } else if (range === '1001-10000') {
                console.log('[Books] Applying 1001-10000 filter');
                const beforeFilter = filtered.length;
                filtered = filtered.filter(book => {
                    const bookPrice = Number(book.price);
                    const isInRange = bookPrice >= 1001 && bookPrice <= 10000;
                    if (bookPrice === 1999) {
                        console.log('[Books] Book with price 1999:', book.title, 'Price:', bookPrice, 'In range:', isInRange);
                    }
                    return isInRange;
                });
                console.log('[Books] Books before filter:', beforeFilter, 'After filter:', filtered.length);
            } else if (range === '10001-above') {
                filtered = filtered.filter(book => Number(book.price) >= 10001);
            }
        }

        // Apply sorting
        this.filteredBooks = this.sortBooks(filtered, this.currentFilters.sortBy);

        this.currentPage = 1;
        this.renderBooks();
        this.updateResultsCount();
        this.renderPagination();
    }

    sortBooks(books, sortBy) {
        const sortedBooks = [...books];
        
        switch (sortBy) {
            case 'newest':
                return sortedBooks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            case 'price-low':
                return sortedBooks.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sortedBooks.sort((a, b) => b.price - a.price);
            case 'title':
                return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
            case 'rating':
                return sortedBooks.sort((a, b) => b.rating - a.rating);
            default:
                return sortedBooks;
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput?.value.trim().toLowerCase();
        
        if (!query) {
            this.filteredBooks = [...this.books];
        } else {
            // Split query into individual words
            const words = query.split(' ').filter(word => word.length > 0);
            
            this.filteredBooks = this.books.filter(book => {
                const title = book.title.toLowerCase();
                const author = book.author.toLowerCase();
                const category = book.category.toLowerCase();
                const description = (book.description || '').toLowerCase();
                
                // Check if ALL words are found in the book (AND logic)
                return words.every(word => 
                    title.includes(word) ||
                    author.includes(word) ||
                    category.includes(word) ||
                    description.includes(word)
                );
            });
        }
        
        this.currentPage = 1;
        const url = new URL(window.location.origin + '/books.html');
        url.searchParams.set('page', 1);
        window.history.replaceState({}, '', url);
        this.renderBooks();
        this.renderPagination();
    }

    // New method to handle search and category from URL parameters
    handleSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const categoryParam = urlParams.get('category');
        const pageParam = urlParams.get('page');
        
        // Handle page parameter first
        if (pageParam) {
            const page = parseInt(pageParam);
            if (page > 0) {
                this.currentPage = page;
                console.log('[Books] Setting currentPage from URL:', page);
            }
        } else {
            console.log('[Books] No page parameter in URL, using default page:', this.currentPage);
        }
        
        if (searchQuery) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchQuery;
            }
            this.handleSearch();
        }
        
        if (categoryParam) {
            // Set the category filter
            this.currentFilters.category = [categoryParam];
            
            // Check the corresponding category checkbox
            const categoryCheckbox = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
            if (categoryCheckbox) {
                categoryCheckbox.checked = true;
            }
            
            // Apply the filter
            this.applyFilters();
        }
        
        // Render books with the correct page after all URL parameters are processed
        this.renderBooks();
    }

    clearAllFilters() {
        // Reset all filter inputs
        document.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });

        // Reset price range dropdown
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) {
            priceRangeSelect.value = '500'; // Default to 500
        }

        // Reset sort
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.value = 'newest';
        }

        // Reset filters object
        this.currentFilters = {
            category: [],
            condition: [],
            language: [],
            priceRange: 500,
            sortBy: 'newest'
        };

        this.applyFilters();
    }

    toggleView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update grid class
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.className = view === 'list' ? 'books-list' : 'books-grid';
        }

        this.renderBooks();
    }

    renderBooks() {
        const booksGrid = document.getElementById('booksGrid');
        if (!booksGrid) return;

        const startIndex = (this.currentPage - 1) * this.booksPerPage;
        const endIndex = startIndex + this.booksPerPage;
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);
        
        console.log('[Books] Rendering books for page:', this.currentPage, 'showing books', startIndex + 1, 'to', endIndex, 'of', this.filteredBooks.length);

        if (booksToShow.length === 0) {
            booksGrid.innerHTML = this.getEmptyState();
            return;
        }

        booksGrid.innerHTML = booksToShow.map(book => 
            this.currentView === 'list' ? this.createBookListItem(book) : this.createBookCard(book)
        ).join('');

        // Add event listeners to book cards
        this.attachBookCardListeners();
    }

    createBookCard(book) {
        const wishlistKey = this.getUserSpecificKey('wishlist');
        let wishlist = [];
        if (this.currentUser) {
            wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        }
        const isInWishlist = wishlist.some(item => String(item.id) === String(book.id || book._id));
        const discountPercent = book.originalPrice ? 
            Math.round((1 - book.price / book.originalPrice) * 100) : 0;
        // If seller book, show INR directly
        let priceHtml;
        if (book.sellerId) {
            if (book.originalPrice && book.originalPrice > book.price) {
                const discountPercent = Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
                priceHtml = `
                    <span class="current-price">${formatInr(book.price)}</span>
                    <span class="original-price">${formatInr(book.originalPrice)}</span>
                    <span class="discount-badge">-${discountPercent}%</span>
                `;
            } else {
                priceHtml = formatInr(book.price);
            }
        } else {
            priceHtml = formatPriceRange(book.price, book.originalPrice);
        }
        return `
            <div class="book-card" data-book-id="${book.id || book._id}">
                <div class="book-image">
                    <img src="${book.image || book.coverImage || '/assets/images/placeholder-book.jpg'}" 
                         alt="${book.title}" loading="lazy">
                    ${discountPercent > 0 ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
                    <div class="book-overlay">
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <div class="book-details">
                        <span class="book-condition">${book.condition}</span>
                        <span class="book-genre">${book.genre}</span>
                    </div>
                    <div class="book-price">
                        ${priceHtml}
                    </div>
                    <div class="book-seller">
                        <small>Sold by ${book.seller}</small>
                    </div>
                    <div class="book-actions">
                        <button class="btn btn-primary btn-add-cart" data-book-id="${book.id || book._id}">
                            Add to Cart
                        </button>
                        <button class="btn-wishlist ${isInWishlist ? 'active' : ''}" 
                                data-book-id="${book.id || book._id}" title="Add to Wishlist">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createBookListItem(book) {
        const discountPercent = book.originalPrice ? 
            Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0;
        let priceHtml;
        if (book.sellerId) {
            if (book.originalPrice && book.originalPrice > book.price) {
                const discountPercent = Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
                priceHtml = `
                    <span class="current-price">${formatInr(book.price)}</span>
                    <span class="original-price">${formatInr(book.originalPrice)}</span>
                    <span class="discount-badge">-${discountPercent}%</span>
                `;
            } else {
                priceHtml = formatInr(book.price);
            }
        } else {
            priceHtml = formatPriceRange(book.price, book.originalPrice);
        }
        return `
            <div class="book-list-item" data-book-id="${book.id || book._id}">
                <div class="book-image">
                    <img src="${book.image || book.coverImage || '/assets/images/placeholder-book.jpg'}" alt="${book.title}" loading="lazy">
                    ${book.availability === 'out-of-stock' ? '<div class="stock-badge">Out of Stock</div>' : ''}
                </div>
                <div class="book-details">
                    <div class="book-header">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                    </div>
                    <div class="book-meta">
                        <div class="book-rating">
                            ${this.createStarRating(book.rating)}
                            <span class="rating-count">(${book.reviews} reviews)</span>
                        </div>
                        <span class="book-category">${this.formatCategory(book.category)}</span>
                        <span class="condition-badge ${book.condition}">${this.formatCondition(book.condition)}</span>
                    </div>
                    <p class="book-description">${book.description}</p>
                    <div class="book-seller">
                        <i class="fas fa-store"></i>
                        <span>Sold by ${book.seller}</span>
                    </div>
                </div>
                <div class="book-price-actions">
                    <div class="price-section">
                        ${priceHtml}
                        ${discountPercent > 0 ? `<div class="discount">${discountPercent}% off</div>` : ''}
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-outline wishlist-btn" data-book-id="${book.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                        ${book.availability === 'available' ? 
                            `<button class="btn btn-primary add-to-cart-btn" data-book-id="${book.id}">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>` :
                            `<button class="btn btn-secondary" disabled>
                                <i class="fas fa-clock"></i> Out of Stock
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return `<div class="stars">${stars}</div><span class="rating-value">${rating}</span>`;
    }

    formatCondition(condition) {
        const conditions = {
            'new': 'New',
            'like-new': 'Like New',
            'good': 'Good',
            'fair': 'Fair'
        };
        return conditions[condition] || condition;
    }

    formatCategory(category) {
        const categories = {
            'fiction': 'Fiction',
            'non-fiction': 'Non-Fiction',
            'textbooks': 'Textbooks',
            'mystery': 'Mystery',
            'romance': 'Romance',
            'sci-fi': 'Science Fiction'
        };
        return categories[category] || category;
    }

    attachBookCardListeners() {
        // Quick view buttons
        document.querySelectorAll('.btn-quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = parseInt(btn.dataset.bookId);
                // Navigate to book details page instead of modal
                window.location.href = `/book-details.html?id=${bookId}`;
            });
        });

        // Wishlist buttons (support both .btn-wishlist and .wishlist-btn)
        document.querySelectorAll('.btn-wishlist, .wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = parseInt(btn.dataset.bookId);
                this.toggleWishlist(bookId, btn);
            });
        });

        // Add to cart buttons (support both .btn-add-cart and .add-to-cart-btn)
        document.querySelectorAll('.btn-add-cart, .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = parseInt(btn.dataset.bookId);
                console.log('[Books] Add to cart clicked for book ID:', bookId);
                this.addToCart(bookId);
            });
        });

        // Book card click for details
        document.querySelectorAll('.book-card, .book-list-item').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const bookId = parseInt(card.dataset.bookId);
                    // Navigate to book details page instead of modal
                    window.location.href = `/book-details.html?id=${bookId}`;
                }
            });
        });
    }

    showBookModal(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        const modal = document.getElementById('bookModal');
        if (!modal) return;

        // Populate modal content
        document.getElementById('bookModalTitle').textContent = 'Book Details';
        document.getElementById('bookModalImage').src = book.image;
        document.getElementById('bookModalImage').alt = book.title;
        document.getElementById('bookModalBookTitle').textContent = book.title;
        document.getElementById('bookModalAuthor').textContent = `by ${book.author}`;
        document.getElementById('bookModalRating').innerHTML = this.createStarRating(book.rating);
        
        const priceHtml = book.originalPrice ? 
            `<span class="current-price">₹${book.price}</span><span class="original-price">₹${book.originalPrice}</span>` :
            `<span class="current-price">₹${book.price}</span>`;
        document.getElementById('bookModalPrice').innerHTML = priceHtml;
        
        document.getElementById('bookModalCondition').innerHTML = 
            `<span class="condition-badge ${book.condition}">${this.formatCondition(book.condition)}</span>`;
        document.getElementById('bookModalDescription').textContent = book.description;
        document.getElementById('bookModalSeller').innerHTML = 
            `<i class="fas fa-store"></i> Sold by ${book.seller}`;

        // Store current book ID for modal actions
        modal.dataset.bookId = bookId;

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    toggleWishlist(bookId, button) {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // Check if user has buyer permissions
        const accountType = this.currentUser.accountType || 'buyer';
        if (accountType !== 'buyer' && accountType !== 'both') {
            this.showNotification('You need a buyer account to add books to wishlist. Please contact support to upgrade your account.', 'error');
            return;
        }

        const book = this.books.find(b => String(b.id || b._id) === String(bookId));
        if (!book) {
            this.showNotification('Book not found', 'error');
            return;
        }

        // Use the global wishlist manager if available, otherwise use local logic
        console.log('[Books] window.wishlistManager available:', !!window.wishlistManager);
        console.log('[Books] window.wishlistManager details:', window.wishlistManager);
        
        if (window.wishlistManager && window.wishlistManager.currentUser) {
            const wishlistKey = this.getUserSpecificKey('wishlist');
            let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
            const existingIndex = wishlist.findIndex(item => String(item.id) === String(bookId));
            
            if (existingIndex > -1) {
                // Remove from wishlist
                window.wishlistManager.removeFromWishlist(bookId);
                if (button) button.classList.remove('active');
                this.showNotification(`"${book.title}" removed from wishlist`, 'info');
            } else {
                // Add to wishlist
                console.log('[Books] Adding to wishlist via wishlistManager:', book);
                window.wishlistManager.addToWishlist(book);
                if (button) button.classList.add('active');
                this.showNotification(`"${book.title}" added to wishlist`, 'success');
            }
        } else {
            // Fallback to local logic
            const wishlistKey = this.getUserSpecificKey('wishlist');
            let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
            const existingIndex = wishlist.findIndex(item => String(item.id) === String(bookId));
            
            if (existingIndex > -1) {
                // Remove from wishlist
                wishlist.splice(existingIndex, 1);
                if (button) button.classList.remove('active');
                this.showNotification(`"${book.title}" removed from wishlist`, 'info');
            } else {
                // Add to wishlist
                const wishlistItem = {
                    id: book.id || book._id,
                    title: book.title,
                    author: book.author,
                    price: book.price,
                    image: book.image || book.coverImage,
                    seller: book.seller || book.sellerName,
                    category: book.category,
                    condition: book.condition,
                    available: book.availability === 'available' || book.status === 'available',
                    dateAdded: new Date().toISOString()
                };
                console.log('[Books] Adding to wishlist via fallback:', wishlistItem);
                console.log('[Books] Current wishlist before adding:', wishlist);
                wishlist.push(wishlistItem);
                console.log('[Books] Wishlist after adding:', wishlist);
                console.log('[Books] Saving to localStorage with key:', wishlistKey);
                localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
                console.log('[Books] localStorage after saving:', localStorage.getItem(wishlistKey));
                if (button) button.classList.add('active');
                this.showNotification(`"${book.title}" added to wishlist`, 'success');
            }
            localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        }
        
        this.updateWishlistCounter();
    }

    addToCart(bookId) {
        console.log('[Books] addToCart called with bookId:', bookId);
        console.log('[Books] currentUser:', this.currentUser);
        
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // Check if user has buyer permissions
        const accountType = this.currentUser.accountType || 'buyer';
        if (accountType !== 'buyer' && accountType !== 'both') {
            this.showNotification('You need a buyer account to add books to cart. Please contact support to upgrade your account.', 'error');
            return;
        }

        const book = this.books.find(b => String(b.id || b._id) === String(bookId));
        console.log('[Books] Found book:', book);
        
        // Check availability - books from sampleData.json use 'status', hardcoded books use 'availability'
        const isAvailable = book && (book.availability === 'available' || book.status === 'available');
        if (!book || !isAvailable) {
            console.log('[Books] Book not found or not available. Book:', book);
            return;
        }

        // Get current cart from localStorage with user-specific key
        const cartKey = this.getUserSpecificKey('cart');
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        const existingItem = cart.find(item => String(item.id) === String(bookId));
        
        if (existingItem) {
            this.showNotification(`"${book.title}" is already in your cart`, 'info');
        } else {
            cart.push({
                id: book.id || book._id,
                title: book.title,
                author: book.author,
                price: book.price,
                image: book.image || book.coverImage,
                seller: book.seller || book.sellerName,
                quantity: 1,
                dateAdded: new Date().toISOString()
            });
            
            localStorage.setItem(cartKey, JSON.stringify(cart));
            this.showNotification(`"${book.title}" added to cart`, 'success');
        }

        // Close modal if open
        this.closeModal();
    }

    updateWishlistCounter() {
        if (this.currentUser) {
            const wishlistKey = this.getUserSpecificKey('wishlist');
            const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
            const counter = document.querySelector('.wishlist-count');
            if (counter) {
                counter.textContent = wishlist.length;
            }
        } else {
            const counter = document.querySelector('.wishlist-count');
            if (counter) {
                counter.textContent = '0';
            }
        }
    }

    showLoginPrompt() {
        this.showNotification('Please log in to continue', 'info');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const total = this.filteredBooks.length;
            resultsCount.textContent = `Showing ${total} book${total !== 1 ? 's' : ''}`;
        }
    }

    setupPagination() {
        // Pagination will be implemented based on the total number of filtered books
        this.renderPagination();
    }

    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredBooks.length / this.booksPerPage);
        
        console.log('[Books] Rendering pagination for page:', this.currentPage, 'of', totalPages, 'total pages');
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Previous
            </button>`;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHTML += `<button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage + 1}">
                Next <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.closest('.pagination-btn').dataset.page);
                this.goToPage(page);
            });
        });
    }

    goToPage(page) {
        this.currentPage = page;
        // Always use /books.html?page=...
        const url = new URL(window.location.origin + '/books.html');
        url.searchParams.set('page', page);
        window.history.replaceState({}, '', url);
        this.renderBooks();
        this.renderPagination();
        
        // Scroll to top of books section
        const booksSection = document.querySelector('.books-section');
        if (booksSection) {
            booksSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showLoadingState() {
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading books...</p>
                </div>
            `;
        }
    }

    showErrorState() {
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Books</h3>
                    <p>Please try again later</p>
                    <button class="btn btn-primary" onclick="booksManager.loadBooks()">Retry</button>
                </div>
            `;
        }
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Books Found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button class="btn btn-primary" onclick="booksManager.clearAllFilters()">Clear Filters</button>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize books manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.booksManager = new BooksManager();
});

// Global functions for backward compatibility
function addToCart(bookId) {
    if (window.booksManager) {
        window.booksManager.addToCart(bookId);
    }
}

function addToWishlist(bookId) {
    if (window.booksManager) {
        window.booksManager.toggleWishlist(bookId);
    }
}

// Debug function to test wishlist manually
window.testWishlist = function() {
    console.log('[Debug] Testing wishlist...');
    console.log('[Debug] window.wishlistManager:', window.wishlistManager);
    console.log('[Debug] window.booksManager:', window.booksManager);
    
    if (window.booksManager && window.booksManager.books && window.booksManager.books.length > 0) {
        const testBook = window.booksManager.books[0];
        console.log('[Debug] Testing with book:', testBook);
        
        if (window.wishlistManager) {
            window.wishlistManager.addToWishlist(testBook);
        } else {
            console.log('[Debug] No wishlist manager available, using fallback');
            window.booksManager.toggleWishlist(testBook.id);
        }
    }
};

// Debug function to check localStorage
window.checkLocalStorage = function() {
    console.log('[Debug] Checking localStorage...');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    console.log('[Debug] currentUser:', currentUser);
    
    if (currentUser) {
        const wishlistKey = `wishlist_${currentUser.id || currentUser._id || currentUser.email}`;
        console.log('[Debug] wishlistKey:', wishlistKey);
        const wishlistData = localStorage.getItem(wishlistKey);
        console.log('[Debug] wishlistData:', wishlistData);
        
        if (wishlistData) {
            const wishlist = JSON.parse(wishlistData);
            console.log('[Debug] Parsed wishlist:', wishlist);
        }
    }
    
    // List all localStorage keys
    console.log('[Debug] All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log('[Debug]', key, ':', localStorage.getItem(key));
    }
};

// Debug function to manually add test item to wishlist
window.addTestItem = function() {
    console.log('[Debug] Adding test item to wishlist...');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        console.log('[Debug] No current user found');
        return;
    }
    
    const wishlistKey = `wishlist_${currentUser.id || currentUser._id || currentUser.email}`;
    console.log('[Debug] Using key:', wishlistKey);
    
    const testItem = {
        id: "test-1",
        title: "Test Book",
        author: "Test Author",
        price: 19.99,
        image: "/assets/images/placeholder-book.jpg",
        seller: "Test Seller",
        category: "fiction",
        condition: "good",
        available: true,
        dateAdded: new Date().toISOString()
    };
    
    // Get current wishlist
    const currentWishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    console.log('[Debug] Current wishlist:', currentWishlist);
    
    // Add test item
    currentWishlist.push(testItem);
    console.log('[Debug] Wishlist after adding:', currentWishlist);
    
    // Save to localStorage
    localStorage.setItem(wishlistKey, JSON.stringify(currentWishlist));
    console.log('[Debug] Saved to localStorage');
    
    // Verify it was saved
    const savedData = localStorage.getItem(wishlistKey);
    console.log('[Debug] Verified saved data:', savedData);
    
    // Reload wishlist page to see if it appears
    console.log('[Debug] Test item added. Please refresh the wishlist page to see if it appears.');
};

// Debug function to test wishlist manager
window.testWishlistManager = function() {
    console.log('[Debug] Testing wishlist manager...');
    console.log('[Debug] window.wishlistManager:', window.wishlistManager);
    
    if (window.wishlistManager) {
        console.log('[Debug] Wishlist manager found');
        console.log('[Debug] Current user:', window.wishlistManager.currentUser);
        console.log('[Debug] Wishlist items:', window.wishlistManager.wishlistItems);
        
        if (window.booksManager && window.booksManager.books && window.booksManager.books.length > 0) {
            const testBook = window.booksManager.books[0];
            console.log('[Debug] Testing with book:', testBook);
            window.wishlistManager.addToWishlist(testBook);
        }
    } else {
        console.log('[Debug] Wishlist manager not available');
    }
};

// Debug function to migrate wishlist data
window.migrateWishlistData = function() {
    console.log('[Debug] Migrating wishlist data...');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        console.log('[Debug] No current user found');
        return;
    }
    
    const oldKey = `wishlist_${currentUser.email}`;
    const newKey = `wishlist_${currentUser.id || currentUser._id || currentUser.email}`;
    
    console.log('[Debug] Old key:', oldKey);
    console.log('[Debug] New key:', newKey);
    
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);
    
    console.log('[Debug] Old data:', oldData);
    console.log('[Debug] New data:', newData);
    
    if (oldData && oldKey !== newKey) {
        console.log('[Debug] Migrating data from old key to new key...');
        localStorage.setItem(newKey, oldData);
        localStorage.removeItem(oldKey);
        console.log('[Debug] Migration complete');
        
        // Reload wishlist if on wishlist page
        if (window.wishlistManager) {
            window.wishlistManager.loadWishlistItems();
        }
    } else {
        console.log('[Debug] No migration needed');
    }
};

function viewBook(bookId) {
    if (window.booksManager) {
        // Navigate to book details page instead of modal
        window.location.href = `/book-details.html?id=${bookId}`;
    }
}

function toggleMobileFilters() {
    const sidebar = document.querySelector('.books-sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    document.body.classList.toggle('mobile-filters-open');
    // Optionally add a backdrop
    if (sidebar.classList.contains('open')) {
        if (!document.getElementById('mobileFiltersBackdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobileFiltersBackdrop';
            backdrop.style.position = 'fixed';
            backdrop.style.top = 0;
            backdrop.style.left = 0;
            backdrop.style.width = '100vw';
            backdrop.style.height = '100vh';
            backdrop.style.background = 'rgba(0,0,0,0.2)';
            backdrop.style.zIndex = 1000;
            backdrop.onclick = () => toggleMobileFilters();
            document.body.appendChild(backdrop);
        }
    } else {
        const backdrop = document.getElementById('mobileFiltersBackdrop');
        if (backdrop) backdrop.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const mobileFiltersBtn = document.querySelector('.mobile-filters-btn');
    if (mobileFiltersBtn) {
        mobileFiltersBtn.addEventListener('click', toggleMobileFilters);
    }
});

// Helper to format INR
function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
}

// --- Price Range Dropdown Logic ---
const priceRangeSelect = document.getElementById('priceRange');
if (priceRangeSelect) {
    priceRangeSelect.addEventListener('change', function() {
        window.currentFilters = window.currentFilters || {};
        window.currentFilters.priceRange = priceRangeSelect.value;
        if (typeof applyFilters === 'function') applyFilters();
    });
}

// --- Integrate with Filtering Logic ---
const origApplyFilters = typeof applyFilters === 'function' ? applyFilters : null;
window.applyFilters = function() {
    let filtered = window.allBooks ? [...window.allBooks] : [];
    // ... existing filters ...
    // Price range filter (dropdown)
    const range = window.currentFilters && window.currentFilters.priceRange;
    if (range && range !== 'all') {
        if (range === '0-500') {
            filtered = filtered.filter(book => Number(book.price) >= 0 && Number(book.price) <= 500);
        } else if (range === '501-1000') {
            filtered = filtered.filter(book => Number(book.price) >= 501 && Number(book.price) <= 1000);
        } else if (range === '1001-10000') {
            filtered = filtered.filter(book => Number(book.price) >= 1001 && Number(book.price) <= 10000);
        } else if (range === '10001-above') {
            filtered = filtered.filter(book => Number(book.price) >= 10001);
        }
    }
    // ... rest of filtering logic ...
    if (typeof origApplyFilters === 'function') {
        origApplyFilters.call(this, filtered);
    } else {
        if (typeof renderBooks === 'function') renderBooks(filtered);
    }
}
