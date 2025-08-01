// Main application JavaScript
import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';
import { preventDeactivatedAction, showAccountDeactivatedMessage } from './utils/api.js';

class LibroLink {
    constructor() {
        this.currentUser = null;
        this.books = [];
        this.categories = [];
        this.cart = [];
        this.wishlist = [];
        this.isLoggedIn = false;
        this.accountStatus = { isActive: true };
        
        this.init();
    }

    async init() {
        this.checkAuthStatus();
        await this.loadInitialData();
        this.loadCart();
        this.loadWishlist();
        this.setupEventListeners();
        this.updateUI();
        this.loadFeaturedBooks();
        this.loadCategories();
        this.updateCartCount();
        this.setupSearchSuggestions();
        this.updateUIForUserRole(); // Add role-based UI updates
    }

    checkAuthStatus() {
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('currentUser');
            
            if (token && user) {
                this.currentUser = JSON.parse(user);
                this.isLoggedIn = true;
                
                // Check account status
                const accountStatus = localStorage.getItem('accountStatus');
                if (accountStatus) {
                    this.accountStatus = JSON.parse(accountStatus);
                } else {
                    // Default to active if no account status exists
                    this.accountStatus = { isActive: true, accountStatus: 'active', deactivatedAt: null };
                    localStorage.setItem('accountStatus', JSON.stringify(this.accountStatus));
                }
            } else {
                // Default account status for non-logged in users
                this.accountStatus = { isActive: true, accountStatus: 'active', deactivatedAt: null };
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.clearStoredUser();
        }
    }

    clearStoredUser() {
        // Save current cart and wishlist data before clearing
        this.saveCart();
        this.saveWishlist();
        
        // Clear only authentication data, preserve shopping data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accountStatus');
        
        this.currentUser = null;
        this.isLoggedIn = false;
        this.accountStatus = { isActive: true };
        
        // Reload cart and wishlist for anonymous user
        this.loadCart();
        this.loadWishlist();
    }

    async loadInitialData() {
        try {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('currentUser');
            if (token && user) {
                this.currentUser = JSON.parse(user);
                this.loadUserWishlist();
            }

            // Load data from API
            const response = await fetch('/api/books');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.books = data.books || [];
            this.categories = data.categories || [];
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            
            // Fallback data if fetch fails
            this.books = [
                {
                    id: "1",
                    title: "The Great Gatsby",
                    author: "F. Scott Fitzgerald",
                    condition: "Very Good",
                    price: 1200.00,
                    originalPrice: 1699.99,
                    coverImage: "/assets/images/great-gatsby.jpg",
                    sellerName: "BookLover123",
                    status: "available",
                    category: "Fiction",
                    genre: "Classic Literature"
                },
                {
                    id: "2",
                    title: "To Kill a Mockingbird",
                    author: "Harper Lee",
                    condition: "Good",
                    price: 1099.50,
                    originalPrice: 1499.99,
                    coverImage: "/assets/images/mockingbird.jpg",
                    sellerName: "ClassicReader",
                    status: "available",
                    category: "Fiction",
                    genre: "Classic Literature"
                },
                {
                    id: "3",
                    title: "Introduction to Algorithms",
                    author: "Thomas H. Cormen",
                    condition: "Like New",
                    price: 2985.00,
                    originalPrice: 3999.99,
                    coverImage: "/assets/images/algorithms.jpg",
                    sellerName: "TechStudent",
                    status: "available",
                    category: "Textbooks",
                    genre: "Computer Science"
                },
                {
                    id: "4",
                    title: "The Very Hungry Caterpillar",
                    author: "Eric Carle",
                    condition: "Good",
                    price: 2799.99,
                    originalPrice: 3499.99,
                    coverImage: "/assets/images/hungry-caterpillar.jpg",
                    sellerName: "FamilyBooks",
                    status: "available",
                    category: "Children's Books",
                    genre: "Children's Picture Book"
                }
            ];
            
            this.categories = [
                {
                    id: "fiction",
                    name: "Fiction",
                    description: "Novels, short stories, and literary fiction",
                    bookCount: 0
                },
                {
                    id: "non-fiction",
                    name: "Non-Fiction",
                    description: "Biography, history, science, and more",
                    bookCount: 0
                },
                {
                    id: "textbooks",
                    name: "Textbooks",
                    description: "Academic textbooks for all subjects",
                    bookCount: 0
                },
                {
                    id: "children",
                    name: "Children's Books",
                    description: "Picture books and young reader collections",
                    bookCount: 0
                }
            ];
        }
    }

    loadCart() {
        try {
            let cartKey = 'cart'; // Default for anonymous users
            if (this.currentUser) {
                const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                cartKey = `cart_${userId}`;
            }
            const cartData = localStorage.getItem(cartKey);
            this.cart = cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    loadWishlist() {
        try {
            let wishlistKey = 'wishlist'; // Default for anonymous users
            if (this.currentUser) {
                const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                wishlistKey = `wishlist_${userId}`;
            }
            const wishlistData = localStorage.getItem(wishlistKey);
            this.wishlist = wishlistData ? JSON.parse(wishlistData) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            this.wishlist = [];
        }
    }

    // Save cart data to localStorage
    saveCart() {
        try {
            let cartKey = 'cart'; // Default for anonymous users
            if (this.currentUser) {
                const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                cartKey = `cart_${userId}`;
            }
            console.log('Main: Saving cart with key:', cartKey, 'data:', this.cart);
            localStorage.setItem(cartKey, JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Save wishlist data to localStorage
    saveWishlist() {
        try {
            let wishlistKey = 'wishlist'; // Default for anonymous users
            if (this.currentUser) {
                const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                wishlistKey = `wishlist_${userId}`;
            }
            localStorage.setItem(wishlistKey, JSON.stringify(this.wishlist));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    async getCurrentUser() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                this.loadUserWishlist();
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            localStorage.removeItem('token');
        }
    }

    async loadUserWishlist() {
        if (!this.currentUser) return;

        // Use id or _id for user identifier
        const userId = this.currentUser.id || this.currentUser._id;
        if (!userId) return;

        try {
            const response = await fetch(`/api/users/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.wishlist = await response.json();
                this.updateWishlistCount();
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Navigation dropdown
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        }

        // Logout functionality is handled by auth.js
        // Removed duplicate logout event listener to prevent conflicts

        // Newsletter subscription
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.subscribeNewsletter(e.target);
            });
        }

        // Handle protected navigation links
        this.setupProtectedNavigation();
    }

    setupProtectedNavigation() {
        // Handle wishlist link
        const wishlistLink = document.getElementById('wishlistLink');
        if (wishlistLink) {
            wishlistLink.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    e.preventDefault();
                    this.showLoginPrompt();
                }
            });
        }

        // Handle cart link
        const cartLink = document.getElementById('cartLink');
        if (cartLink) {
            cartLink.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    e.preventDefault();
                    this.showLoginPrompt();
                }
            });
        }

        // Handle all wishlist links in the page
        const wishlistLinks = document.querySelectorAll('a[href*="wishlist"]');
        wishlistLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    e.preventDefault();
                    this.showLoginPrompt();
                }
            });
        });

        // Handle all cart links in the page
        const cartLinks = document.querySelectorAll('a[href*="cart"]');
        cartLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    e.preventDefault();
                    this.showLoginPrompt();
                }
            });
        });
    }

    updateUI() {
        const navUser = document.getElementById('navUser');
        const navUserMenu = document.getElementById('navUserMenu');
        const userDisplayName = document.getElementById('userDisplayName');
        if (this.currentUser) {
            if (navUser) navUser.style.display = 'none';
            if (navUserMenu) navUserMenu.style.display = 'block';
            if (userDisplayName) userDisplayName.textContent = this.currentUser.firstName || this.currentUser.username || this.currentUser.fullName;
        } else {
            if (navUser) navUser.style.display = 'flex';
            if (navUserMenu) navUserMenu.style.display = 'none';
        }
        this.updateWishlistCount();
    }

    updateWishlistCount() {
        const wishlistCount = document.querySelector('.wishlist-count');
        if (wishlistCount) {
            wishlistCount.textContent = this.wishlist.length;
            wishlistCount.style.display = this.wishlist.length > 0 ? 'inline' : 'none';
        }
    }

    async loadFeaturedBooks() {
        const grid = document.getElementById('featuredBooksGrid');
        if (!grid) return;
        
        try {
            // Shuffle books array for random featured books
            const shuffled = [...this.books].sort(() => Math.random() - 0.5);
            
            // Get featured books (available books, limit to 8)
            const featuredBooks = shuffled
                .filter(book => book.status === 'available')
                .slice(0, 8);
            
            if (featuredBooks.length === 0) {
                grid.innerHTML = '<p>No featured books available at the moment.</p>';
                return;
            }
            
            const bookCards = featuredBooks.map(book => this.createBookCard(book));
            grid.innerHTML = bookCards.join('');
            this.setupBookCardListeners(grid);

            // --- Event Delegation for Buttons ---
            grid.addEventListener('click', (e) => {
                const addCartBtn = e.target.closest('.btn-add-cart');
                const wishlistBtn = e.target.closest('.btn-wishlist');
                if (addCartBtn) {
                    e.stopPropagation();
                    const bookId = addCartBtn.dataset.bookId;
                    this.addToCart(bookId);
                }
                if (wishlistBtn) {
                    e.stopPropagation();
                    const bookId = wishlistBtn.dataset.bookId;
                    this.toggleWishlist(bookId, wishlistBtn);
                }
            });
            
        } catch (error) {
            console.error('Error loading featured books:', error);
            grid.innerHTML = '<p>Error loading books. Please try again later.</p>';
        }
    }

    async loadCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) {
            // Categories grid only exists on homepage, so this is expected on other pages
            return;
        }
        
        if (this.categories.length === 0) {
            console.log('No categories loaded');
            return;
        }
        
        console.log('Loading categories:', this.categories);

        const categoryIcons = {
            'fiction': 'fas fa-book-open',
            'non-fiction': 'fas fa-graduation-cap',
            'textbooks': 'fas fa-university',
            'children': 'fas fa-child'
        };

        // Calculate actual book counts for each category
        const categoriesWithCounts = this.categories.map(category => {
            const bookCount = this.books.filter(book => 
                book.category && book.category.toLowerCase() === category.name.toLowerCase()
            ).length;
            
            return {
                ...category,
                bookCount: bookCount
            };
        });

        grid.innerHTML = categoriesWithCounts.map(category => `
            <a href="/books.html?category=${category.id}" class="category-card">
                <div class="category-icon">
                    <i class="${categoryIcons[category.id] || 'fas fa-book'}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <span class="book-count">${category.bookCount} books</span>
            </a>
        `).join('');
    }

    createBookCard(book) {
        // Defensive check for wishlist
        const isInWishlist = Array.isArray(this.wishlist) && this.wishlist.some(item => item.id === book.id);
        const discountPercent = book.originalPrice ? 
            Math.round((1 - book.price / book.originalPrice) * 100) : 0;
        // Use INR for seller books
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
                        <small>Sold by ${book.seller || book.sellerName || ''}</small>
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

    setupBookCardListeners(container) {
        // Quick view buttons
        container.querySelectorAll('.btn-quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.bookId;
                this.showBookModal(bookId);
            });
        });

        // Add to cart buttons
        container.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.bookId;
                this.addToCart(bookId);
            });
        });

        // Wishlist buttons
        container.querySelectorAll('.btn-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.bookId;
                this.toggleWishlist(bookId, btn);
            });
        });

        // Book card clicks (navigate to book details)
        container.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookId = card.dataset.bookId;
                window.location.href = `/book-details.html?id=${bookId}`;
            });
        });
    }

    async toggleWishlist(bookId, button) {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        if (!this.checkBuyPermission()) {
            return;
        }

        const book = this.books.find(b => String(b.id) === String(bookId));
        if (!book) {
            this.showNotification('Book not found', 'error');
            return;
        }
        
        const existingIndex = this.wishlist.findIndex(item => String(item.id) === String(bookId));
        if (existingIndex > -1) {
            // Remove from wishlist
            this.wishlist.splice(existingIndex, 1);
            if (button) button.classList.remove('active');
            this.showNotification(`"${book.title}" removed from wishlist`, 'info');
        } else {
            // Add to wishlist
            this.wishlist.push({
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                image: book.coverImage || '/assets/images/placeholder-book.jpg',
                dateAdded: new Date().toISOString()
            });
            if (button) button.classList.add('active');
            this.showNotification(`"${book.title}" added to wishlist`, 'success');
        }
        
        this.saveWishlist();
        this.updateWishlistCount();
    }

    async addToCart(bookId) {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        if (!this.checkBuyPermission()) {
            return;
        }

        const book = this.books.find(b => b.id === bookId);
        if (!book || book.status !== 'available') {
            this.showNotification('Book is not available', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.id === bookId);
        if (existingItem) {
            this.showNotification(`"${book.title}" is already in your cart`, 'info');
        } else {
            this.cart.push({
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                image: book.coverImage || '/assets/images/placeholder-book.jpg',
                quantity: 1,
                dateAdded: new Date().toISOString()
            });
            this.showNotification(`"${book.title}" added to cart`, 'success');
        }
        
        this.saveCart();
        this.updateCartCount();
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchContainer = searchInput?.parentNode;
        const query = searchInput.value.trim();
        
        if (query) {
            // Add searching animation
            if (searchContainer) {
                searchContainer.classList.add('searching');
            }
            
            // Check if this is an exact book title match
            const exactMatch = this.findExactBookMatch(query);
            if (exactMatch) {
                // Small delay to show the animation
                setTimeout(() => {
                    // Navigate to book details page
                    window.location.href = `/book-details.html?id=${exactMatch.id}`;
                }, 300);
            } else {
                // Small delay to show the animation
                setTimeout(() => {
                    // Navigate to books page with search query
                    window.location.href = `/books.html?search=${encodeURIComponent(query)}`;
                }, 300);
            }
        }
    }

    findExactBookMatch(query) {
        // Check if any book title exactly matches the search query (case-insensitive)
        return this.books.find(book => 
            book.title.toLowerCase() === query.toLowerCase()
        );
    }

    setupSearchSuggestions() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        // Create suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        suggestionsContainer.style.display = 'none';
        searchInput.parentNode.appendChild(suggestionsContainer);

        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim().toLowerCase();
            
            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                this.showSearchSuggestions(query, suggestionsContainer);
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });

        // Handle suggestion clicks
        suggestionsContainer.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                const query = suggestionItem.dataset.query;
                searchInput.value = query;
                suggestionsContainer.style.display = 'none';
                this.performSearch();
            }
        });
    }

    showSearchSuggestions(query, container) {
        if (!this.books || this.books.length === 0) return;

        const suggestions = [];
        const words = query.split(' ').filter(word => word.length > 0);

        // Find books that match any of the words
        this.books.forEach(book => {
            const title = book.title.toLowerCase();
            const author = book.author.toLowerCase();
            const category = book.category.toLowerCase();

            // Check if any word matches
            const matches = words.some(word => 
                title.includes(word) || 
                author.includes(word) || 
                category.includes(word)
            );

            if (matches) {
                suggestions.push({
                    type: 'book',
                    title: book.title,
                    author: book.author,
                    query: book.title,
                    id: book.id
                });
            }
        });

        // Add category suggestions
        const categories = [...new Set(this.books.map(book => book.category))];
        categories.forEach(category => {
            const categoryLower = category.toLowerCase();
            if (words.some(word => categoryLower.includes(word))) {
                suggestions.push({
                    type: 'category',
                    title: category,
                    query: category
                });
            }
        });

        // Limit suggestions and render
        const limitedSuggestions = suggestions.slice(0, 8);
        this.renderSearchSuggestions(limitedSuggestions, container);
    }

    renderSearchSuggestions(suggestions, container) {
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        const html = suggestions.map(suggestion => {
            if (suggestion.type === 'book') {
                return `
                    <div class="suggestion-item" data-query="${suggestion.query}">
                        <i class="fas fa-book suggestion-icon"></i>
                        <div class="suggestion-text">
                            <div class="suggestion-title">${suggestion.title}</div>
                            <div class="suggestion-subtitle">by ${suggestion.author}</div>
                        </div>
                        <span class="suggestion-category">Book</span>
                    </div>
                `;
            } else {
                return `
                    <div class="suggestion-item" data-query="${suggestion.query}">
                        <i class="fas fa-tags suggestion-icon"></i>
                        <div class="suggestion-text">
                            <div class="suggestion-title">${suggestion.title}</div>
                        </div>
                        <span class="suggestion-category">Category</span>
                    </div>
                `;
            }
        }).join('');

        container.innerHTML = html;
        container.style.display = 'block';
    }

    async subscribeNewsletter(form) {
        const email = form.querySelector('input[type="email"]').value;
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                this.showNotification('Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                this.showNotification('Error subscribing to newsletter', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showNotification('Error subscribing to newsletter', 'error');
        }
    }

    showBookModal(bookId) {
        // Implementation for book quick view modal
        console.log('Show book modal for:', bookId);
        // This would open a modal with book details
    }

    showLoginPrompt() {
        this.showNotification('Please log in to continue', 'info');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = '';
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 32px;
            padding: 18px 32px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            font-size: 1.15rem;
            z-index: 99999;
            box-shadow: 0 8px 32px rgba(102,126,234,0.18);
            animation: slideIn 0.4s cubic-bezier(.4,0,.2,1);
            display: flex;
            align-items: center;
            gap: 18px;
        `;

        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            default:
                notification.style.background = '#667eea';
        }

        // Add message span
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        notification.appendChild(msgSpan);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background: none; border: none; color: #fff; font-size: 1.3rem; margin-left: 16px; cursor: pointer;';
        closeBtn.onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        };
        notification.appendChild(closeBtn);

        document.body.appendChild(notification);

        // Set timeout: 7s for error, 5s for others
        const timeout = type === 'error' ? 7000 : 5000;
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, timeout);
    }

    logout() {
        // Save current cart and wishlist data before logout
        this.saveCart();
        this.saveWishlist();
        
        // Clear only authentication data, preserve shopping data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accountStatus');
        
        this.currentUser = null;
        this.isLoggedIn = false;
        this.accountStatus = { isActive: true };
        
        // Clear cart and wishlist arrays and update UI
        this.cart = [];
        this.wishlist = [];
        
        // Update cart and wishlist counts to show 0 and hide badges
        this.updateCartCount();
        this.updateWishlistCount();
        
        this.updateUI();
        this.showNotification('Logged out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
            cartCount.style.display = this.cart.length > 0 ? 'inline' : 'none';
        }
    }

    // Add role-based access control methods
    getUserRole() {
        if (!this.currentUser) return null;
        return this.currentUser.accountType || 'buyer';
    }

    canBuy() {
        const role = this.getUserRole();
        return role === 'buyer' || role === 'both';
    }

    canSell() {
        const role = this.getUserRole();
        return role === 'seller' || role === 'both';
    }

    updateUIForUserRole() {
        const role = this.getUserRole();
        
        // Update navigation based on user role
        this.updateNavigationForRole(role);
        
        // Update hero section buttons based on user role
        this.updateHeroButtonsForRole(role);
        
        // Update user menu based on role
        this.updateUserMenuForRole(role);
    }

    updateNavigationForRole(role) {
        const sellerDashboardLink = document.querySelector('a[href="/seller-dashboard.html"]');
        const buyLinks = document.querySelectorAll('a[href="/books.html"], a[href="/cart.html"], a[href="/wishlist.html"]');
        const sellLinks = document.querySelectorAll('a[href="/seller-dashboard.html"]');
        
        if (role === 'seller') {
            // Hide buying features for seller-only users
            buyLinks.forEach(link => {
                if (link.closest('.nav-links')) {
                    link.style.display = 'none';
                }
            });
            
            // Show seller features
            sellLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
        } else if (role === 'buyer') {
            // Hide selling features for buyer-only users
            sellLinks.forEach(link => {
                link.style.display = 'none';
            });
            
            // Show buying features
            buyLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
        } else if (role === 'both') {
            // Show all features for both buyer and seller
            buyLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
            sellLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
        } else {
            // Not logged in - show all features (they'll be restricted when they try to use them)
            buyLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
            sellLinks.forEach(link => {
                link.style.display = 'inline-block';
            });
        }
    }

    updateHeroButtonsForRole(role) {
        const browseBooksBtn = document.querySelector('.hero-actions .btn-primary');
        const startSellingBtn = document.querySelector('.hero-actions .btn-secondary');
        
        if (role === 'seller') {
            // For seller-only users, change the primary action to selling
            if (browseBooksBtn) {
                browseBooksBtn.textContent = 'Start Selling';
                browseBooksBtn.href = '/seller-dashboard.html';
                browseBooksBtn.classList.remove('btn-primary');
                browseBooksBtn.classList.add('btn-secondary');
            }
            if (startSellingBtn) {
                startSellingBtn.textContent = 'Browse Books';
                startSellingBtn.href = '/books.html';
                startSellingBtn.classList.remove('btn-secondary');
                startSellingBtn.classList.add('btn-primary');
            }
        } else if (role === 'buyer') {
            // For buyer-only users, hide the selling button
            if (startSellingBtn) {
                startSellingBtn.style.display = 'none';
            }
        } else if (role === 'both') {
            // For both, show both buttons as normal
            if (browseBooksBtn) {
                browseBooksBtn.textContent = 'Browse Books';
                browseBooksBtn.href = '/books.html';
                browseBooksBtn.classList.remove('btn-secondary');
                browseBooksBtn.classList.add('btn-primary');
            }
            if (startSellingBtn) {
                startSellingBtn.textContent = 'Start Selling';
                startSellingBtn.href = '/seller-dashboard.html';
                startSellingBtn.classList.remove('btn-primary');
                startSellingBtn.classList.add('btn-secondary');
                startSellingBtn.style.display = 'inline-block';
            }
        }
    }

    updateUserMenuForRole(role) {
        const userMenu = document.querySelector('.dropdown-menu');
        if (!userMenu) return;
        
        const profileLink = userMenu.querySelector('a[href="/profile.html"]');
        const sellerDashboardLink = userMenu.querySelector('a[href="/seller-dashboard.html"]');
        const wishlistLink = userMenu.querySelector('a[href="/wishlist.html"]');
        const cartLink = userMenu.querySelector('a[href="/cart.html"]');
        
        if (role === 'seller') {
            // Hide buying-related menu items
            if (wishlistLink) wishlistLink.style.display = 'none';
            if (cartLink) cartLink.style.display = 'none';
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'block';
        } else if (role === 'buyer') {
            // Hide selling-related menu items
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
            if (wishlistLink) wishlistLink.style.display = 'block';
            if (cartLink) cartLink.style.display = 'block';
        } else if (role === 'both') {
            // Show all menu items
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'block';
            if (wishlistLink) wishlistLink.style.display = 'block';
            if (cartLink) cartLink.style.display = 'block';
        }
    }

    // Add permission checking methods
    checkBuyPermission() {
        if (!this.canBuy()) {
            this.showNotification('You need a buyer account to purchase books. Please contact support to upgrade your account.', 'error');
            return false;
        }
        return true;
    }

    checkSellPermission() {
        if (!this.canSell()) {
            this.showNotification('You need a seller account to sell books. Please contact support to upgrade your account.', 'error');
            return false;
        }
        return true;
    }
}

// Helper to format INR
function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
}

// --- Naruto Swinging Cursor ---
(function() {
  document.body.style.cursor = 'none';
  const narutoCursor = document.createElement('img');
  narutoCursor.src = 'assets/images/naruto-cursor.png';
  narutoCursor.style.position = 'fixed';
  narutoCursor.style.pointerEvents = 'none';
  narutoCursor.style.zIndex = '9999';
  narutoCursor.style.width = '32px';
  narutoCursor.style.height = '32px';
  narutoCursor.style.transition = 'transform 0.1s linear';
  document.body.appendChild(narutoCursor);

  document.addEventListener('mousemove', (e) => {
    narutoCursor.style.left = e.clientX + 'px';
    narutoCursor.style.top = e.clientY + 'px';
  });

  let angle = 0;
  let direction = 1;
  let swinging = false;
  let swingStartTime = 0;
  const SWING_DURATION = 5000; // 5 seconds in ms
  const SWING_INTERVAL = 30000; // 0.5 minutes in ms
  let swingTimeout = null;
  let restTimeout = null;

  function startSwing() {
    swinging = true;
    swingStartTime = Date.now();
    if (restTimeout) {
      clearTimeout(restTimeout);
      restTimeout = null;
    }
    if (swingTimeout) {
      clearTimeout(swingTimeout);
      swingTimeout = null;
    }
    swingTimeout = setTimeout(() => {
      swinging = false;
      narutoCursor.style.transform = 'rotate(0deg)';
      restTimeout = setTimeout(startSwing, SWING_INTERVAL - SWING_DURATION);
    }, SWING_DURATION);
  }

  function swingCursor() {
    if (swinging) {
      angle += direction * 1.5;
      if (angle > 30 || angle < -30) direction *= -1;
      narutoCursor.style.transform = `rotate(${angle}deg)`;
    }
    requestAnimationFrame(swingCursor);
  }

  // Double-tap/double-click handler to trigger swing immediately
  function triggerSwingNow() {
    startSwing();
  }
  document.addEventListener('dblclick', triggerSwingNow);
  let lastTap = 0;
  document.addEventListener('touchend', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 400 && tapLength > 0) {
      triggerSwingNow();
      e.preventDefault();
    }
    lastTap = currentTime;
  });

  // Start the first swing immediately
  startSwing();
  swingCursor();
})();

// --- Interactive 3D Tilt Effect ---
function apply3DTilt(selector = '.tilt-3d') {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * 10;
      el.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
      el.classList.add('tilted');
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.classList.remove('tilted');
    });
  });
}

// Smooth scrolling functionality
function initSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Smooth scroll to top functionality
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top-btn';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        font-size: 18px;
    `;

    document.body.appendChild(scrollToTopBtn);

    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
            scrollToTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
            scrollToTopBtn.style.transform = 'translateY(20px)';
        }
    });

    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Hover effects for scroll to top button
    scrollToTopBtn.addEventListener('mouseenter', () => {
        scrollToTopBtn.style.transform = 'translateY(-3px) scale(1.1)';
        scrollToTopBtn.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.4)';
    });

    scrollToTopBtn.addEventListener('mouseleave', () => {
        scrollToTopBtn.style.transform = 'translateY(0) scale(1)';
        scrollToTopBtn.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
    });

    // Optimize scroll performance
    let ticking = false;
    function updateScroll() {
        // Add any scroll-based animations here
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.libroLink = new LibroLink();
    apply3DTilt('.book-card, .profile-card, .stat-card, .card, .wishlist-item, .order-card, .address-card, .payment-method-card, .book-image img, .item-image img');
    initSmoothScrolling();
});

window.showNotification = (...args) => {
    if (window.libroLink) window.libroLink.showNotification(...args);
};