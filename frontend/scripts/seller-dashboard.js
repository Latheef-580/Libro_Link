// seller-dashboard.js - Seller Dashboard functionality
import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';

// --- GLOBAL BOOKS UTILS ---
function getGlobalBooks() {
    return JSON.parse(localStorage.getItem('global_books') || '[]');
}
function setGlobalBooks(books) {
    localStorage.setItem('global_books', JSON.stringify(books));
}

// Helper to format INR
function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
}

class SellerDashboard {
    constructor() {
        this.currentUser = null;
        this.myBooks = [];
        this.orders = [];
        this.analytics = {};
        this.currentTab = 'overview';
        this.init();
    }

    async init() {
        this.checkAuthStatus();
        if (this.currentUser) {
            await this.loadDashboardData();
            this.setupEventListeners();
            this.setupTabNavigation();
            this.updateUI();
        }
    }

    checkAuthStatus() {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        // Check if user has seller permissions
        const accountType = user.accountType || 'buyer';
        if (accountType !== 'seller' && accountType !== 'both') {
            alert('You need a seller account to access the seller dashboard. Please contact support to upgrade your account.');
            window.location.href = '/';
            return;
        }
        
        this.currentUser = user;
        this.updateNavigation();
    }

    updateNavigation() {
        const userDisplayName = document.getElementById('userDisplayName');
        if (userDisplayName) {
            userDisplayName.textContent = this.currentUser.firstName || 'Seller';
        }
    }

    async loadDashboardData() {
        try {
            // Load seller's books
            await this.loadMyBooks();
            
            // Load orders
            await this.loadOrders();
            
            // Load analytics
            await this.loadAnalytics();
            
            // Update overview stats
            this.updateOverviewStats();
            
        } catch (error) {
            console.error('[SellerDashboard] Error loading dashboard data:', error);
        }
    }

    async loadMyBooks() {
        // Only books where sellerId matches current user
        const globalBooks = getGlobalBooks();
        const sellerId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
        this.myBooks = globalBooks.filter(b => String(b.sellerId) === String(sellerId));
        
        console.log('[SellerDashboard] Loaded seller books:', this.myBooks);
    }

    async loadOrders() {
        // Only orders for this seller's books
        const allOrders = JSON.parse(localStorage.getItem('all_orders') || '[]');
        const sellerId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
        this.orders = allOrders.filter(o => String(o.sellerId) === String(sellerId));
        
        console.log('[SellerDashboard] Loaded seller orders:', this.orders);
    }

    async loadAnalytics() {
        try {
            // Calculate analytics from books and orders
            const totalBooks = this.myBooks.length;
            const totalSales = this.orders.filter(order => order.status === 'completed').length;
            const totalEarnings = this.orders
                .filter(order => order.status === 'completed')
                .reduce((sum, order) => sum + (order.total || 0), 0);
            const totalViews = this.myBooks.reduce((sum, book) => sum + (book.views || 0), 0);

            this.analytics = {
                totalBooks,
                totalSales,
                totalEarnings,
                totalViews,
                recentActivity: this.generateRecentActivity()
            };
            
            console.log('[SellerDashboard] Loaded analytics:', this.analytics);
        } catch (error) {
            console.error('[SellerDashboard] Error loading analytics:', error);
            this.analytics = {
                totalBooks: 0,
                totalSales: 0,
                totalEarnings: 0,
                totalViews: 0,
                recentActivity: []
            };
        }
    }

    generateRecentActivity() {
        const activities = [];
        
        // Add recent book listings
        this.myBooks.slice(0, 3).forEach(book => {
            activities.push({
                type: 'book_listed',
                message: `You listed a new book: "${book.title}"`,
                timestamp: book.dateAdded || new Date().toISOString(),
                icon: 'fas fa-book'
            });
        });
        
        // Add recent orders
        this.orders.slice(0, 3).forEach(order => {
            activities.push({
                type: 'order_received',
                message: `Order received for "${order.bookTitle}"`,
                timestamp: order.dateCreated || new Date().toISOString(),
                icon: 'fas fa-shopping-bag'
            });
        });
        
        // Sort by timestamp and return recent activities
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }

    updateOverviewStats() {
        // Update stats cards
        const totalBooksEl = document.getElementById('totalBooks');
        const totalSalesEl = document.getElementById('totalSales');
        const totalEarningsEl = document.getElementById('totalEarnings');
        const totalViewsEl = document.getElementById('totalViews');

        if (totalBooksEl) totalBooksEl.textContent = this.analytics.totalBooks;
        if (totalSalesEl) totalSalesEl.textContent = this.analytics.totalSales;
        if (totalEarningsEl) totalEarningsEl.textContent = formatInr(this.analytics.totalEarnings);
        if (totalViewsEl) totalViewsEl.textContent = this.analytics.totalViews;

        // Update recent activity
        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        if (this.analytics.recentActivity.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p>No recent activity</p>
                        <small>Start by listing your first book</small>
                    </div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = this.analytics.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <small>${this.formatTimeAgo(activity.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    setupEventListeners() {
        // Add book form
        const addBookForm = document.getElementById('addBookForm');
        if (addBookForm) {
            addBookForm.addEventListener('submit', (e) => this.handleAddBook(e));
        }

        // Image upload
        this.setupImageUpload();

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Book actions
        this.setupBookActions();

        // Settings save
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveSettings();
        }
        // Account deletion
        const deleteBtn = document.getElementById('deleteAccountBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => this.deleteAccount();
        }
        // Add New Book button in My Books section
        const addNewBookBtn = document.getElementById('addNewBookBtn');
        if (addNewBookBtn) {
            addNewBookBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTab('add-book');
            });
        }
    }

    setupTabNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                this.showTab(tab);
                // Update URL hash
                window.location.hash = tab;
            });
        });
        // On load, activate tab from hash if present
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.showTab(hash);
        }
    }

    showTab(tabName) {
        // Update menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'my-books':
                this.renderMyBooks();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
        // Update URL hash
        window.location.hash = tabName;
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('bookImages');
        const imagePreview = document.getElementById('imagePreview');

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleImageFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });
    }

    handleImageFiles(files) {
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) return;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    imagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async handleAddBook(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const samplePdfFile = document.getElementById('bookSamplePdf').files[0];
        const coverImageFile = document.getElementById('bookCoverImage').files[0];
        let samplePdfPath, coverImagePath;
        // Upload cover image if selected
        if (coverImageFile) {
            const imgForm = new FormData();
            imgForm.append('image', coverImageFile);
            const imgRes = await fetch('/api/upload/image', { method: 'POST', body: imgForm });
            const imgData = await imgRes.json();
            coverImagePath = imgData.path;
        }
        // Upload sample PDF if selected
        if (samplePdfFile) {
            const pdfForm = new FormData();
            pdfForm.append('pdf', samplePdfFile);
            const pdfRes = await fetch('/api/upload/pdf', { method: 'POST', body: pdfForm });
            const pdfData = await pdfRes.json();
            samplePdfPath = pdfData.path;
        }
        const form = document.getElementById('addBookForm');
        const isEdit = form.dataset.editMode === 'true';
        const editBookId = form.dataset.editBookId;
        // Use previous image/pdf if editing and no new file selected
        const prevBook = isEdit ? this.myBooks.find(b => b.id === editBookId) : undefined;
        let bookData = {
            id: isEdit ? editBookId : Date.now().toString(),
            title: formData.get('title'),
            author: formData.get('author'),
            isbn: formData.get('isbn'),
            category: formData.get('category'),
            genre: formData.get('genre') || '',
            language: formData.get('language') || '',
            description: formData.get('description'),
            preview: formData.get('preview') || '',
            price: parseFloat(formData.get('price')),
            originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice')) : undefined,
            condition: formData.get('condition'),
            availability: formData.get('availability'),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : undefined,
            publisher: formData.get('publisher') || '',
            publicationYear: formData.get('publicationYear') ? parseInt(formData.get('publicationYear')) : undefined,
            location: formData.get('location') || '',
            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
            shippingOptions: formData.get('shippingOptions') ? formData.get('shippingOptions').split(',').map(s => s.trim()).filter(Boolean) : [],
            rating: 0, // Default, can be updated by reviews
            reviews: 0, // Default, can be updated by reviews
            seller: this.currentUser.firstName + ' ' + this.currentUser.lastName,
            sellerId: this.currentUser.id || this.currentUser._id || this.currentUser.email,
            status: 'available',
            views: 0,
            dateAdded: new Date().toISOString(),
            image: coverImagePath || (prevBook ? prevBook.image : '/assets/images/placeholder-book.jpg'),
            coverImage: coverImagePath || (prevBook ? prevBook.image : '/assets/images/placeholder-book.jpg'),
            samplePdf: samplePdfPath || (prevBook ? prevBook.samplePdf : undefined)
        };
        try {
            if (isEdit) {
                // Update in seller's books
                this.myBooks = this.myBooks.map(b => b.id === editBookId ? bookData : b);
                // Update in global books
                const globalBooks = getGlobalBooks().map(b => b.id === editBookId ? bookData : b);
                setGlobalBooks(globalBooks);
                form.dataset.editMode = '';
                form.dataset.editBookId = '';
                this.showNotification('Book updated successfully!', 'success');
            } else {
                this.myBooks.push(bookData);
                await this.saveMyBooks();
                this.showNotification('Book added successfully!', 'success');
            }
            await this.saveMyBooks();
            e.target.reset();
            document.getElementById('imagePreview').innerHTML = '';
            await this.loadAnalytics();
            this.updateOverviewStats();
            this.renderMyBooks();
            this.showTab('my-books');
        } catch (error) {
            this.showNotification('Error saving book. Please try again.', 'error');
        }
    }

    async saveMyBooks() {
        // Save seller's books to global_books (merge with others)
        const globalBooks = getGlobalBooks();
        const sellerId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
        // Remove old books by this seller
        const others = globalBooks.filter(b => String(b.sellerId) !== String(sellerId));
        setGlobalBooks([...others, ...this.myBooks]);
    }

    renderMyBooks() {
        const tableBody = document.getElementById('myBooksTable');
        if (!tableBody) return;
        if (this.myBooks.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-book"></i>
                            <h3>No Books Listed</h3>
                            <p>Start by adding your first book</p>
                            <button class="btn btn-primary" id="addNewBookBtn">
                                <i class="fas fa-plus"></i> Add New Book
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        tableBody.innerHTML = this.myBooks.map(book => `
            <tr>
                <td>
                    <div class="book-info">
                        <img src="${book.image || '/assets/images/placeholder-book.jpg'}" alt="${book.title}" class="book-thumbnail">
                        <div>
                            <h4>${book.title}</h4>
                            <p>by ${book.author}</p>
                            <div><small>Genre: ${book.genre || '-'} </small></div>
                            <div><small>Category: ${book.category || '-'} </small></div>
                        </div>
                    </div>
                </td>
                <td>${formatInr(book.price)}</td>
                <td><span class="condition-badge ${book.condition}">${this.formatCondition(book.condition)}</span></td>
                <td><span class="status-badge ${book.status}">${this.formatStatus(book.status)}</span></td>
                <td>${book.views || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-outline edit-book-btn" data-book-id="${book.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger delete-book-btn" data-book-id="${book.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderOrders() {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;

        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>Orders will appear here when customers buy your books</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id}</h4>
                        <p>${order.bookTitle} by ${order.bookAuthor}</p>
                    </div>
                    <span class="status-badge ${order.status}">${this.formatStatus(order.status)}</span>
                </div>
                <div class="order-details">
                    <div class="order-meta">
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(order.dateCreated)}</span>
                        <span><i class="fas fa-user"></i> ${order.customerName}</span>
                        <span><i class="fas fa-rupee-sign"></i> ${formatInr(order.total)}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-small btn-primary" onclick="sellerDashboard.updateOrderStatus('${order.id}', 'shipped')">
                            Mark as Shipped
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        if (!analyticsContainer) return;

        // Calculate additional analytics
        const monthlyEarnings = this.calculateMonthlyEarnings();
        const topBooks = this.getTopBooks();

        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Monthly Earnings</h3>
                    <div class="chart-placeholder">
                        <p>${formatInr(monthlyEarnings)}</p>
                        <small>This month</small>
                    </div>
                </div>
                <div class="analytics-card">
                    <h3>Top Performing Books</h3>
                    <div class="top-books-list">
                        ${topBooks.map(book => `
                            <div class="top-book-item">
                                <span>${book.title}</span>
                                <span>${book.views} views</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    calculateMonthlyEarnings() {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        return this.orders
            .filter(order => {
                const orderDate = new Date(order.dateCreated);
                return orderDate.getMonth() === thisMonth && 
                       orderDate.getFullYear() === thisYear &&
                       order.status === 'completed';
            })
            .reduce((sum, order) => sum + (order.total || 0), 0);
    }

    getTopBooks() {
        return this.myBooks
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
    }

    editBook(bookId) {
        const book = this.myBooks.find(b => b.id === bookId);
        if (!book) return;
        // Populate form with book data
        document.getElementById('bookTitle').value = book.title || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookISBN').value = book.isbn || '';
        document.getElementById('bookCategory').value = book.category || '';
        document.getElementById('bookGenre').value = book.genre || '';
        document.getElementById('bookLanguage').value = book.language || '';
        document.getElementById('bookDescription').value = book.description || '';
        document.getElementById('bookPreview').value = book.preview || '';
        document.getElementById('bookPrice').value = book.price || '';
        document.getElementById('bookOriginalPrice').value = book.originalPrice || '';
        document.getElementById('bookCondition').value = book.condition || '';
        document.getElementById('bookAvailability').value = book.availability || 'available';
        document.getElementById('bookPageCount').value = book.pageCount || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookPublicationYear').value = book.publicationYear || '';
        document.getElementById('bookLocation').value = book.location || '';
        document.getElementById('bookTags').value = (book.tags || []).join(', ');
        document.getElementById('bookShippingOptions').value = (book.shippingOptions || []).join(', ');
        // Note: Images/PDF cannot be pre-filled for security reasons
        // Set edit mode
        const form = document.getElementById('addBookForm');
        form.dataset.editMode = 'true';
        form.dataset.editBookId = bookId;
        this.showTab('add-book');
    }

    async deleteBook(bookId) {
        if (!confirm('Are you sure you want to delete this book?')) return;
        // Remove from seller's books
        this.myBooks = this.myBooks.filter(b => b.id !== bookId);
        // Remove from global books
        const globalBooks = getGlobalBooks().filter(b => b.id !== bookId);
        setGlobalBooks(globalBooks);
        this.showNotification('Book deleted successfully!', 'success');
        await this.saveMyBooks();
        this.renderMyBooks();
        await this.loadAnalytics();
        this.updateOverviewStats();
    }

    async updateOrderStatus(orderId, status) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                order.dateUpdated = new Date().toISOString();
                
                // Save orders
                const allOrders = JSON.parse(localStorage.getItem('all_orders') || '[]');
                const sellerId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                const others = allOrders.filter(o => String(o.sellerId) !== String(sellerId));
                setGlobalBooks([...others, ...this.orders]); // Save all orders globally
                
                this.showNotification(`Order status updated to ${status}!`, 'success');
                this.renderOrders();
            }
        } catch (error) {
            console.error('[SellerDashboard] Error updating order status:', error);
            this.showNotification('Error updating order status.', 'error');
        }
    }

    setupBookActions() {
        // Use event delegation for edit/delete buttons
        const tableBody = document.getElementById('myBooksTable');
        if (!tableBody) return;
        tableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-book-btn');
            if (editBtn) {
                const bookId = editBtn.getAttribute('data-book-id');
                this.editBook(bookId);
                return;
            }
            const deleteBtn = e.target.closest('.delete-book-btn');
            if (deleteBtn) {
                const bookId = deleteBtn.getAttribute('data-book-id');
                this.deleteBook(bookId);
                return;
            }
        });
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

    formatStatus(status) {
        const statuses = {
            'available': 'Available',
            'sold': 'Sold',
            'pending': 'Pending',
            'shipped': 'Shipped',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statuses[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    updateUI() {
        // Update navigation counts
        this.updateWishlistCount();
        this.updateCartCount();
    }

    updateWishlistCount() {
        const wishlistCounts = document.querySelectorAll('.wishlist-count');
        const wishlistKey = `wishlist_${this.currentUser.id || this.currentUser._id || this.currentUser.email}`;
        const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        
        wishlistCounts.forEach(count => {
            count.textContent = wishlist.length;
        });
    }

    updateCartCount() {
        const cartCounts = document.querySelectorAll('.cart-count');
        const cartKey = `cart_${this.currentUser.id || this.currentUser._id || this.currentUser.email}`;
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        cartCounts.forEach(count => {
            count.textContent = cart.length;
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    }

    async saveSettings() {
        // Save store name, description, email
        const storeName = document.getElementById('storeName').value;
        const storeDescription = document.getElementById('storeDescription').value;
        const email = document.getElementById('email').value;
        // Save to localStorage (simulate backend)
        let user = JSON.parse(localStorage.getItem('currentUser'));
        user.storeName = storeName;
        user.storeDescription = storeDescription;
        user.email = email;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('settingsFeedback').textContent = 'Settings saved!';
        setTimeout(() => document.getElementById('settingsFeedback').textContent = '', 2000);
    }
    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        // Remove all seller's books and orders
        const sellerId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
        setGlobalBooks(getGlobalBooks().filter(b => String(b.sellerId) !== String(sellerId)));
        localStorage.setItem('all_orders', JSON.stringify((JSON.parse(localStorage.getItem('all_orders') || '[]')).filter(o => String(o.sellerId) !== String(sellerId))));
        localStorage.removeItem('currentUser');
        window.location.href = '/register.html';
    }
}

// Initialize seller dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.sellerDashboard = new SellerDashboard();
});

// Global functions for HTML onclick handlers
window.showTab = function(tabName) {
    if (window.sellerDashboard) {
        window.sellerDashboard.showTab(tabName);
    }
}; 