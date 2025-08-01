// LibroLink - Wishlist Management Script
// Handles wishlist operations, filtering, sorting, and interactions

import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';

class WishlistManager {
    constructor() {
        this.wishlistItems = [];
        this.filteredItems = [];
        this.currentSort = 'date-added';
        this.currentCategory = 'all';
        this.currentAvailability = 'all';
        this.isLoggedIn = false;
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkAuthStatus();
        if (this.isLoggedIn) {
            this.loadWishlistItems();
            this.bindEvents();
            this.setupFilters();
            this.loadRecommendations();
        }
    }

    checkAuthStatus() {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.isLoggedIn = !!user;
        this.currentUser = user;
        
        if (!this.isLoggedIn) {
            // Redirect to login page if not authenticated
            window.location.href = '/login.html';
            return;
        }
        
        // Check if user has buyer permissions
        const accountType = this.currentUser.accountType || 'buyer';
        if (accountType !== 'buyer' && accountType !== 'both') {
            alert('You need a buyer account to access the wishlist. Please contact support to upgrade your account.');
            window.location.href = '/';
            return;
        }
        
        // Update navigation
        this.updateNavigation(user);
    }

    getUserSpecificKey(key) {
        if (!this.currentUser) return key;
        const userKey = `${key}_${this.currentUser.id || this.currentUser._id || this.currentUser.email}`;
        console.log('[Wishlist] getUserSpecificKey:', key, '->', userKey, 'for user:', this.currentUser);
        return userKey;
    }

    updateNavigation(user) {
        const navUser = document.getElementById('navUser');
        const navUserMenu = document.getElementById('navUserMenu');
        const userDisplayName = document.getElementById('userDisplayName');
        
        if (navUser) navUser.style.display = 'none';
        if (navUserMenu) navUserMenu.style.display = 'block';
        if (userDisplayName) userDisplayName.textContent = user.firstName || 'User';
    }

    async loadWishlistItems() {
        const userKey = this.getUserSpecificKey('wishlist');
        
        // Check for data migration from old key format
        const oldKey = `wishlist_${this.currentUser.email}`;
        const oldData = localStorage.getItem(oldKey);
        
        if (oldData && oldKey !== userKey) {
            console.log('[Wishlist] Found data in old key format, migrating...');
            console.log('[Wishlist] Old key:', oldKey, 'New key:', userKey);
            console.log('[Wishlist] Old data:', oldData);
            
            // Migrate data to new key
            localStorage.setItem(userKey, oldData);
            localStorage.removeItem(oldKey);
            console.log('[Wishlist] Data migrated successfully');
        }
        
        let rawWishlist = JSON.parse(localStorage.getItem(userKey) || '[]');
        
        // Clean up invalid items (remove items with missing essential properties)
        this.wishlistItems = rawWishlist.filter(item => {
            const isValid = item && 
                           item.id && 
                           item.title && 
                           item.title !== 'undefined' && 
                           item.author && 
                           item.author !== 'undefined';
            
            if (!isValid) {
                console.log('[Wishlist] Removing invalid item:', item);
            }
            
            return isValid;
        });
        
        // Save cleaned data back to localStorage
        if (this.wishlistItems.length !== rawWishlist.length) {
            localStorage.setItem(userKey, JSON.stringify(this.wishlistItems));
            console.log('[Wishlist] Cleaned wishlist data saved');
        }
        
        console.log('[Wishlist] Loaded from key:', userKey, this.wishlistItems);
        console.log('[Wishlist] Current user:', this.currentUser);
        console.log('[Wishlist] User key:', userKey);
        this.applyFilters(); // Apply filters to populate filteredItems
        this.updateWishlistCount();
        this.updateStats(); // Update wishlist summary stats
    }

    async saveWishlist() {
        const userKey = this.getUserSpecificKey('wishlist');
        console.log('[Wishlist] saveWishlist called with items:', this.wishlistItems);
        console.log('[Wishlist] Saving to key:', userKey);
        
        try {
            localStorage.setItem(userKey, JSON.stringify(this.wishlistItems));
            console.log('[Wishlist] localStorage after saving:', localStorage.getItem(userKey));
            
            // Verify the save was successful
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('[Wishlist] Verified saved data:', parsedData);
                console.log('[Wishlist] Save successful - items count:', parsedData.length);
            } else {
                console.error('[Wishlist] Save failed - no data found in localStorage');
            }
        } catch (error) {
            console.error('[Wishlist] Error saving to localStorage:', error);
        }
        
        await this.loadWishlistItems();
    }

    updateWishlistCount() {
        const wishlistCounts = document.querySelectorAll('.wishlist-count');
        wishlistCounts.forEach(count => {
            count.textContent = this.wishlistItems.length;
        });
    }

    bindEvents() {
        // Filter events
        const sortFilter = document.getElementById('sortFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applySorting();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.applyFilters();
            });
        }

        if (availabilityFilter) {
            availabilityFilter.addEventListener('change', (e) => {
                this.currentAvailability = e.target.value;
                this.applyFilters();
            });
        }

        // Action buttons
        const clearWishlistBtn = document.getElementById('clearWishlistBtn');
        const shareWishlistBtn = document.getElementById('shareWishlistBtn');
        const addAllAvailableBtn = document.querySelector('.summary-actions .btn-primary');

        if (clearWishlistBtn) {
            clearWishlistBtn.addEventListener('click', () => this.clearWishlist());
        }

        if (shareWishlistBtn) {
            shareWishlistBtn.addEventListener('click', () => this.showShareModal());
        }

        if (addAllAvailableBtn) {
            addAllAvailableBtn.addEventListener('click', () => this.addAllAvailableToCart());
        }

        // Remove item events (delegated)
        document.addEventListener('click', (e) => {
            // Remove from wishlist
            if (e.target.closest('.remove-btn')) {
                const bookId = e.target.closest('.remove-btn').dataset.bookId;
                this.removeFromWishlist(bookId);
            }
            // View Details button (anime-themed)
            if (e.target.closest('.btn.btn-outline.btn-small') && e.target.closest('.wishlist-item')) {
                const bookId = e.target.closest('.wishlist-item').dataset.bookId;
                this.viewBook(bookId);
            }
            // Add to Cart button (anime-themed)
            if (e.target.closest('.btn.btn-primary.btn-full') && e.target.closest('.wishlist-item')) {
                const bookId = e.target.closest('.wishlist-item').dataset.bookId;
                this.addToCart(bookId);
            }
            // Notify When Available button
            if (e.target.closest('.btn-secondary') && e.target.closest('.wishlist-item')) {
                const bookId = e.target.closest('.wishlist-item').dataset.bookId;
                this.notifyWhenAvailable(bookId);
            }
        });

        // Modal events
        this.bindModalEvents();

        // Copy share link (new button)
        const copyShareBtn = document.getElementById('copyShareBtn');
        if (copyShareBtn) {
            copyShareBtn.addEventListener('click', () => {
                const shareUrl = document.getElementById('shareUrl');
                if (shareUrl) {
                    shareUrl.select();
                    shareUrl.setSelectionRange(0, 99999);
                    navigator.clipboard.writeText(shareUrl.value).then(() => {
                        const msg = document.getElementById('copySuccessMsg');
                        if (msg) {
                            msg.style.display = 'block';
                            setTimeout(() => { msg.style.display = 'none'; }, 1500);
                        }
                    });
                }
            });
        }
    }

    bindModalEvents() {
        const shareModal = document.getElementById('shareModal');
        const modalCloses = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');

        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                this.hideModal(shareModal);
            });
        });

        // Click outside modal to close
        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) {
                    this.hideModal(shareModal);
                }
            });
        }
    }

    setupFilters() {
        // Set initial filter values
        const sortFilter = document.getElementById('sortFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');

        if (sortFilter) sortFilter.value = this.currentSort;
        if (categoryFilter) categoryFilter.value = this.currentCategory;
        if (availabilityFilter) availabilityFilter.value = this.currentAvailability;
    }

    applyFilters() {
        let filtered = [...this.wishlistItems];
        console.log('[Wishlist] Applying filters:', {
            totalItems: this.wishlistItems.length,
            currentCategory: this.currentCategory,
            currentAvailability: this.currentAvailability,
            currentSort: this.currentSort
        });
        
        // Category filter
        if (this.currentCategory && this.currentCategory !== 'all') {
            filtered = filtered.filter(item => {
                const itemCategory = (item.category || 'uncategorized').trim().toLowerCase();
                return itemCategory === this.currentCategory.trim().toLowerCase();
            });
        }

        // Availability filter
        if (this.currentAvailability !== 'all') {
            switch (this.currentAvailability) {
                case 'available':
                    filtered = filtered.filter(item => item.available);
                    break;
                case 'out-of-stock':
                    filtered = filtered.filter(item => !item.available);
                    break;
                case 'price-drop':
                    filtered = filtered.filter(item => item.priceDropped);
                    break;
            }
        }

        console.log('[Wishlist] After filtering:', filtered.length, 'items');
        this.filteredItems = filtered;
        this.applySorting();
    }

    applySorting() {
        this.filteredItems.sort((a, b) => {
            switch (this.currentSort) {
                case 'date-added':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.author.localeCompare(b.author);
                default:
                    return 0;
            }
        });

        this.renderWishlist();
    }

    renderWishlist() {
        const wishlistGrid = document.getElementById('wishlistGrid');
        const emptyWishlist = document.getElementById('emptyWishlist');
        const wishlistContent = document.getElementById('wishlistContent');

        if (!wishlistGrid) return;

        if (this.filteredItems.length === 0) {
            if (this.wishlistItems.length === 0) {
                // Completely empty wishlist
                wishlistGrid.style.display = 'none';
                if (emptyWishlist) {
                    emptyWishlist.style.display = 'block';
                    emptyWishlist.classList.add('fade-in');
                }
            } else {
                // No items match current filters
                wishlistGrid.innerHTML = `
                    <div class="no-results fade-in" style="background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(102,126,234,0.10); padding: 60px 20px; text-align: center;">
                        <i class="fas fa-filter" style="font-size: 48px; color: #667eea; margin-bottom: 18px;"></i>
                        <h3 style="color: #333; margin-bottom: 8px;">No items match your filters</h3>
                        <p style="color: #888; margin-bottom: 18px;">Try adjusting your filter settings</p>
                        <button class="btn btn-outline" id="clearFiltersBtn">Clear Filters</button>
                    </div>
                `;
            }
            return;
        }

        if (emptyWishlist) emptyWishlist.style.display = 'none';
        wishlistGrid.style.display = 'grid';

        wishlistGrid.innerHTML = this.filteredItems.map(item => this.renderWishlistItem(item)).join('');
        // Add fade-in animation
        setTimeout(() => {
            wishlistGrid.querySelectorAll('.wishlist-item').forEach(el => el.classList.add('fade-in'));
        }, 10);
        
        // Update stats after rendering
        this.updateStats();
    }

    renderWishlistItem(item) {
        // Add fallbacks for all properties to prevent "undefined" display
        const safeTitle = item.title || 'Unknown Title';
        const safeAuthor = item.author || 'Unknown Author';
        const safeCategory = item.category || 'uncategorized';
        const safeSeller = item.seller || 'Unknown Seller';
        const safeImage = item.image || '/assets/images/placeholder-book.jpg';
        const safeCondition = item.condition || 'good';
        const safePrice = item.price || 0;
        
        const dateAdded = this.formatDateAdded(item.dateAdded);
        const availabilityBadge = item.available ? 
            '<div class="availability-badge available">Available</div>' :
            '<div class="availability-badge out-of-stock">Out of Stock</div>';
        
        const conditionClass = safeCondition.replace(' ', '-').toLowerCase();
        let priceInfo = formatInr(safePrice);

        const priceAlerts = item.priceDropped ? `
            <div class="price-alerts">
                <span class="price-drop-alert">
                    <i class="fas fa-trending-down"></i>
                    Price dropped ${formatInr((item.originalPrice || safePrice) - safePrice)}
                </span>
            </div>
        ` : '';

        const actionButton = item.available ? `
            <button class="btn btn-primary btn-full" onclick="wishlistManager.addToCart(${item.id})">
                <i class="fas fa-shopping-cart"></i>
                Add to Cart
            </button>
        ` : `
            <button class="btn btn-secondary btn-full" onclick="wishlistManager.notifyWhenAvailable(${item.id})">
                <i class="fas fa-clock"></i>
                Notify When Available
            </button>
        `;

        return `
            <div class="wishlist-item" data-book-id="${item.id}">
                <div class="item-image">
                    <img src="${safeImage}" alt="${safeTitle}">
                    ${availabilityBadge}
                </div>
                <div class="item-details">
                    <div class="item-header">
                        <h3 class="item-title">${safeTitle}</h3>
                        <button class="remove-btn" data-book-id="${item.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="item-author">by ${safeAuthor}</p>
                    <p class="item-category">${this.formatCategory(safeCategory)}</p>
                    <div class="item-condition">
                        <span class="condition-badge ${conditionClass}">${this.formatCondition(safeCondition)}</span>
                    </div>
                    <div class="item-meta">
                        <span class="added-date">Added ${dateAdded}</span>
                        <span class="seller-info">Sold by ${safeSeller}</span>
                    </div>
                </div>
                <div class="item-price">
                    <div class="price-info">
                        ${priceInfo}
                    </div>
                    ${priceAlerts}
                    ${!item.available ? '<div class="stock-info"><span class="stock-status">Currently unavailable</span></div>' : ''}
                </div>
                <div class="item-actions">
                    ${actionButton}
                    <button class="btn btn-outline btn-small" onclick="wishlistManager.viewBook(${item.id})">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    formatDateAdded(date) {
        const now = new Date();
        const diffTime = Math.abs(now - new Date(date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    formatCategory(category) {
        const categories = {
            'fiction': 'Fiction',
            'non-fiction': 'Non-Fiction',
            'textbooks': 'Textbooks',
            'mystery': 'Mystery',
            'romance': 'Romance',
            'sci-fi': 'Science Fiction',
            'children': "Children's Books"
        };
        return categories[category] || category;
    }

    formatCondition(condition) {
        const conditions = {
            'new': 'New',
            'like-new': 'Like New',
            'excellent': 'Excellent',
            'good': 'Good',
            'fair': 'Fair'
        };
        return conditions[condition] || condition;
    }

    updateStats() {
        const totalItems = this.wishlistItems.length;
        const availableItems = this.wishlistItems.filter(item => item.available).length;
        const outOfStockItems = totalItems - availableItems;
        
        // Calculate total value - only count available items and handle price conversion
        const totalValue = this.wishlistItems.reduce((sum, item) => {
            // Only count available items
            if (!item.available) return sum;
            
            // Convert price to number and handle undefined/null values
            const price = parseFloat(item.price) || 0;
            return sum + price;
        }, 0);

        console.log('[Wishlist] Stats calculation:', {
            totalItems,
            availableItems,
            outOfStockItems,
            totalValue,
            items: this.wishlistItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                available: item.available,
                priceType: typeof item.price
            }))
        });

        // Update header stats
        const totalItemsEl = document.getElementById('totalItems');
        const totalValueEl = document.getElementById('totalValue');

        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (totalValueEl) totalValueEl.textContent = formatInr(totalValue);

        // Update summary stats
        const summaryTotalItems = document.getElementById('summaryTotalItems');
        const summaryAvailable = document.getElementById('summaryAvailable');
        const summaryOutOfStock = document.getElementById('summaryOutOfStock');
        const summaryTotalValue = document.getElementById('summaryTotalValue');

        if (summaryTotalItems) summaryTotalItems.textContent = totalItems;
        if (summaryAvailable) summaryAvailable.textContent = availableItems;
        if (summaryOutOfStock) summaryOutOfStock.textContent = outOfStockItems;
        if (summaryTotalValue) summaryTotalValue.textContent = formatInr(totalValue);

        // Update wishlist count in navigation
        this.updateWishlistCount();
    }

    async addToWishlist(book) {
        console.log('[Wishlist] addToWishlist called with book:', book);
        const userKey = this.getUserSpecificKey('wishlist');
        console.log('[Wishlist] Using user key:', userKey);
        
        // Load current wishlist
        const currentWishlist = JSON.parse(localStorage.getItem(userKey) || '[]');
        console.log('[Wishlist] Current wishlist from localStorage:', currentWishlist);
        
        this.wishlistItems = currentWishlist;
        const existing = this.wishlistItems.find(item => String(item.id) === String(book.id));
        
        if (!existing) {
            // Normalize category and ensure consistent properties
            const normalizedCategory = (book.category || '').trim().toLowerCase() || 'uncategorized';
            const wishlistItem = {
                ...book,
                category: normalizedCategory,
                available: book.availability === 'available' || book.status === 'available',
                image: book.image || book.coverImage,
                seller: book.seller || book.sellerName
            };
            
            console.log('[Wishlist] Creating wishlist item:', wishlistItem);
            this.wishlistItems.push(wishlistItem);
            console.log('[Wishlist] Wishlist after adding:', this.wishlistItems);
            
            await this.saveWishlist();
            this.currentCategory = 'all';
            this.currentSort = 'date-added';
            this.currentAvailability = 'all';
            this.applyFilters();
            this.updateStats(); // Update stats after adding item
        } else {
            console.log('[Wishlist] Book already exists in wishlist:', book.id);
        }
    }

    async removeFromWishlist(id) {
        this.wishlistItems = this.wishlistItems.filter(i => String(i.id) !== String(id));
        await this.saveWishlist();
        this.currentCategory = 'all';
        this.currentSort = 'date-added';
        this.currentAvailability = 'all';
        this.applyFilters();
        this.updateStats(); // Update stats after removing item
    }

    clearWishlist() {
        if (this.wishlistItems.length === 0) return;

        if (confirm('Are you sure you want to clear your entire wishlist? This action cannot be undone.')) {
            this.wishlistItems = [];
            this.filteredItems = [];
            this.saveWishlist();
            this.renderWishlist();
            this.updateStats();
            window.showNotification('Wishlist cleared', 'success');
        }
    }

    clearFilters() {
        this.currentSort = 'date-added';
        this.currentCategory = 'all';
        this.currentAvailability = 'all';
        
        const sortFilter = document.getElementById('sortFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');

        if (sortFilter) sortFilter.value = this.currentSort;
        if (categoryFilter) categoryFilter.value = this.currentCategory;
        if (availabilityFilter) availabilityFilter.value = this.currentAvailability;

        this.applyFilters();
    }

    async addToCart(bookId) {
        const item = this.wishlistItems.find(item => item.id === bookId);
        if (!item || !item.available) return;

        // Add to cart with user-specific storage
        const cartKey = this.getUserSpecificKey('cart');
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const existingCartItem = cart.find(cartItem => cartItem.id === bookId);

        if (existingCartItem) {
            window.showNotification('Book is already in your cart', 'info');
        } else {
            cart.push({
                id: item.id,
                title: item.title,
                author: item.author,
                price: item.price,
                image: item.image,
                seller: item.seller,
                quantity: 1,
                dateAdded: new Date()
            });
            localStorage.setItem(cartKey, JSON.stringify(cart));
            window.showNotification('Book added to cart', 'success');
        }
    }

    async addAllAvailableToCart() {
        const availableItems = this.wishlistItems.filter(item => item.available);
        if (availableItems.length === 0) {
            window.showNotification('No available items to add to cart', 'info');
            return;
        }

        const cartKey = this.getUserSpecificKey('cart');
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        let addedCount = 0;

        for (const item of availableItems) {
            const existingCartItem = cart.find(cartItem => cartItem.id === item.id);
            if (!existingCartItem) {
                cart.push({
                    id: item.id,
                    title: item.title,
                    author: item.author,
                    price: item.price,
                    image: item.image,
                    seller: item.seller,
                    quantity: 1,
                    dateAdded: new Date()
                });
                addedCount++;
            }
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        if (addedCount > 0) {
            window.showNotification(`${addedCount} books added to cart`, 'success');
        } else {
            window.showNotification('All available books are already in your cart', 'info');
        }
    }

    notifyWhenAvailable(bookId) {
        // This would typically make an API call to set up notifications
        window.showNotification('You will be notified when this book becomes available', 'success');
    }

    viewBook(bookId) {
        // Navigate to book details page
        window.location.href = `/book-details.html?id=${bookId}`;
    }

    showShareModal() {
        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
            shareModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    generateRecommendations() {
        // Try to use the main books list from books.html if available
        let allBooks = [];
        if (window.libroLink && Array.isArray(window.libroLink.books)) {
            allBooks = window.libroLink.books;
        } else {
            // Fallback: use a static set if not available
            allBooks = [
                // ... fallback books ...
            ];
        }

        // Get categories and authors from the user's wishlist
        const wishlistCategories = [...new Set(this.wishlistItems.map(item => item.category))];
        const wishlistAuthors = [...new Set(this.wishlistItems.map(item => item.author))];

        // Recommend books that match the user's wishlist categories or authors, and are not already in the wishlist
        const wishlistIds = new Set(this.wishlistItems.map(item => String(item.id)));
        let recommendations = allBooks.filter(book =>
            !wishlistIds.has(String(book.id)) &&
            (wishlistCategories.includes(book.category) || wishlistAuthors.includes(book.author))
        );

        // If not enough recommendations, fill with random books not in wishlist
        if (recommendations.length < 4) {
            const moreBooks = allBooks.filter(book => !wishlistIds.has(String(book.id)) && !recommendations.includes(book));
            while (recommendations.length < 4 && moreBooks.length > 0) {
                recommendations.push(moreBooks.shift());
            }
        }

        // Limit to 4 recommendations
        return recommendations.slice(0, 4);
    }

    renderRecommendationCard(book) {
        const stars = '★'.repeat(Math.floor(book.rating || 0)) + 
                    ((book.rating && book.rating % 1 !== 0) ? '☆' : '') + 
                    '☆'.repeat(5 - Math.ceil(book.rating || 0));
        const image = book.image || book.coverImage || '/assets/images/placeholder-book.jpg';
        return `
            <div class="book-card">
                <div class="book-image">
                    <img src="${image}" alt="${book.title}">
                    <div class="book-overlay">
                        <button class="btn btn-primary btn-small rec-view-details" data-book-id="${book.id}">
                            View Details
                        </button>
                        <button class="btn btn-outline btn-small rec-wishlist-btn" data-book-id="${book.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="book-info">
                    <h4 class="book-title">${book.title}</h4>
                    <p class="book-author">by ${book.author}</p>
                    <div class="book-rating">
                        <span class="stars">${stars}</span>
                        <span class="rating-number">${book.rating || ''}</span>
                    </div>
                    <div class="book-price">$${book.price ? book.price.toFixed(2) : ''}</div>
                </div>
            </div>
        `;
    }

    async loadRecommendations() {
        // Load recommendations based on wishlist items
        const recommendationsGrid = document.getElementById('recommendationsGrid');
        if (!recommendationsGrid) return;

        // Simulate loading
        setTimeout(async () => {
            const recommendations = this.generateRecommendations();
            recommendationsGrid.innerHTML = recommendations.map(book => 
                this.renderRecommendationCard(book)
            ).join('');

            // Attach event listeners for recommendation buttons
            recommendationsGrid.querySelectorAll('.rec-view-details').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookId = btn.getAttribute('data-book-id');
                    this.viewBook(bookId);
                });
            });
            recommendationsGrid.querySelectorAll('.rec-wishlist-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookId = btn.getAttribute('data-book-id');
                    // Add to wishlist from recommendations
                    this.addToWishlistFromRecommendation(bookId);
                });
            });
        }, 1000);
    }

    async addToWishlistFromRecommendation(bookId) {
        // Simulate fetching book data
        const recommendations = this.generateRecommendations();
        const book = recommendations.find(r => r.id === bookId);
        
        if (book) {
            const bookData = {
                title: book.title,
                author: book.author,
                category: book.category,
                price: book.price,
                originalPrice: null,
                condition: "new",
                seller: "LibroLink Store",
                image: book.image,
                available: true,
                priceDropped: false,
                discount: 0
            };
            
            await this.addToWishlist(bookId, bookData);
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 32px;
            right: 32px;
            z-index: 2000;
            min-width: 220px;
            background: white;
            color: #333;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(102,126,234,0.12);
            padding: 18px 28px 18px 18px;
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 1rem;
            border-left: 5px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s, transform 0.3s;
        `;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="font-size: 1.3rem;"></i>
            <span>${message}</span>
            <button class="toast-close" style="background: none; border: none; color: #999; font-size: 1.2rem; margin-left: auto; cursor: pointer;">&times;</button>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = 1;
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = 0;
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = 0;
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        });
    }
}

function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
}

// Global functions for HTML onclick handlers
window.addToCart = async function(bookId) {
    if (window.wishlistManager) {
        await window.wishlistManager.addToCart(bookId);
    }
};

window.viewBook = function(bookId) {
    if (window.wishlistManager) {
        window.wishlistManager.viewBook(bookId);
    }
};

window.addAllAvailableToCart = async function() {
    if (window.wishlistManager) {
        await window.wishlistManager.addAllAvailableToCart();
    }
};

window.copyShareLink = function() {
    const shareUrl = document.getElementById('shareUrl');
    if (shareUrl) {
        shareUrl.select();
        shareUrl.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(shareUrl.value).then(() => {
            if (window.wishlistManager) {
                window.wishlistManager.showToast('Link copied to clipboard', 'success');
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Wishlist] DOMContentLoaded - Initializing WishlistManager');
    window.wishlistManager = new WishlistManager();
    console.log('[Wishlist] WishlistManager initialized:', window.wishlistManager);
    
    // Add to Cart buttons
    document.querySelectorAll('[id^="addToCartBtn"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.id.replace('addToCartBtn', '');
            if (window.wishlistManager) {
                const item = window.wishlistManager.wishlistItems.find(b => String(b.id) === id);
                if (item) window.wishlistManager.addToCart(item.id);
            }
        });
    });
    
    // View Details buttons
    document.querySelectorAll('[id^="viewBookBtn"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.id.replace('viewBookBtn', '');
            if (window.wishlistManager) {
                window.wishlistManager.viewBook(id);
            }
        });
    });
    
    // Clear Filters button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'clearFiltersBtn') {
            if (window.wishlistManager) {
                window.wishlistManager.clearFilters();
            }
        }
    });
    
    // Null check for categories grid
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (categoriesGrid) {
        // ... your categories grid logic ...
    }
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded, initialize immediately
    console.log('[Wishlist] DOM already loaded - Initializing WishlistManager immediately');
    window.wishlistManager = new WishlistManager();
    console.log('[Wishlist] WishlistManager initialized immediately:', window.wishlistManager);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WishlistManager;
}

// Debug function to test wishlist total value calculation
window.testWishlistTotal = function() {
    console.log('[Debug] Testing wishlist total value calculation...');
    if (window.wishlistManager) {
        console.log('[Debug] Current wishlist items:', window.wishlistManager.wishlistItems);
        
        const totalItems = window.wishlistManager.wishlistItems.length;
        const availableItems = window.wishlistManager.wishlistItems.filter(item => item.available).length;
        const outOfStockItems = totalItems - availableItems;
        
        // Calculate total value manually
        const totalValue = window.wishlistManager.wishlistItems.reduce((sum, item) => {
            if (!item.available) return sum;
            const price = parseFloat(item.price) || 0;
            return sum + price;
        }, 0);
        
        console.log('[Debug] Manual calculation:', {
            totalItems,
            availableItems,
            outOfStockItems,
            totalValue,
            totalValueInr: formatInr(totalValue),
            items: window.wishlistManager.wishlistItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                priceInr: formatInr(item.price),
                priceType: typeof item.price,
                available: item.available
            }))
        });
        
        // Update stats to see the result
        window.wishlistManager.updateStats();
        
        return {
            totalItems,
            availableItems,
            outOfStockItems,
            totalValue,
            totalValueInr: formatInr(totalValue)
        };
    } else {
        console.log('[Debug] WishlistManager not available');
        return null;
    }
};

// Debug function to test currency conversion
window.testCurrencyConversion = function() {
    console.log('[Debug] Testing currency conversion...');
    const testPrices = [12.99, 25.50, 0, 100, 5.99];
    
    testPrices.forEach(price => {
        console.log(`₹${price} = ${formatInr(price)}`);
    });
    
    console.log('[Debug] Exchange rate:', getExchangeRate());
    return testPrices.map(price => ({
        price: price,
        inr: formatInr(price)
    }));
};

// Debug function to force update wishlist summary
window.forceUpdateWishlistSummary = function() {
    console.log('[Debug] Forcing wishlist summary update...');
    if (window.wishlistManager) {
        console.log('[Debug] Current wishlist items:', window.wishlistManager.wishlistItems);
        window.wishlistManager.updateStats();
        console.log('[Debug] Wishlist summary updated');
        
        // Check if summary elements exist and show their values
        const summaryElements = {
            totalItems: document.getElementById('summaryTotalItems'),
            available: document.getElementById('summaryAvailable'),
            outOfStock: document.getElementById('summaryOutOfStock'),
            totalValue: document.getElementById('summaryTotalValue')
        };
        
        console.log('[Debug] Summary elements:', {
            totalItems: summaryElements.totalItems?.textContent,
            available: summaryElements.available?.textContent,
            outOfStock: summaryElements.outOfStock?.textContent,
            totalValue: summaryElements.totalValue?.textContent
        });
    } else {
        console.log('[Debug] WishlistManager not available');
    }
};

/* Modern fade-in animation for wishlist items and empty state */
const style = document.createElement('style');
style.innerHTML = `
.fade-in {
    animation: fadeInModern 0.6s cubic-bezier(.4,0,.2,1);
}
@keyframes fadeInModern {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
`;
document.head.appendChild(style);