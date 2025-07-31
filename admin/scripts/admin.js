// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.charts = {};
        this.data = {
            users: [],
            books: [],
            orders: [],
            reviews: []
        };
        this.filters = {
            users: { status: 'all', type: 'all', search: '' },
            books: { status: 'all', category: 'all', search: '' },
            orders: { status: 'all', dateFrom: '', dateTo: '', search: '' }
        };
        this.pagination = {
            users: { page: 1, limit: 10, total: 0 },
            books: { page: 1, limit: 10, total: 0 },
            orders: { page: 1, limit: 10, total: 0 },
            reviews: { page: 1, limit: 10, total: 0 }
        };
        
        this.init();
    }

    init() {
        // Check if admin is logged in
        if (!this.checkAdminAuth()) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeCharts();
        this.setupDropdowns();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Search button
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchValue = globalSearch.value;
                if (searchValue.trim()) {
                    this.handleGlobalSearch(searchValue);
                }
            });
        }

        // Notification bell
        const notificationBell = document.querySelector('.notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }

        // User management
        this.setupUserManagement();
        
        // Book management
        this.setupBookManagement();
        
        // Order management
        this.setupOrderManagement();
        
        // Settings
        this.setupSettings();
        
        // Modal handlers
        this.setupModals();
        
        // Chart controls
        this.setupChartControls();
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    setupUserManagement() {
        // User filters
        const userStatusFilter = document.getElementById('userStatusFilter');
        const userTypeFilter = document.getElementById('userTypeFilter');
        const userSearchInput = document.getElementById('userSearchInput');
        const addUserBtn = document.getElementById('addUserBtn');
        const exportUsersBtn = document.getElementById('exportUsersBtn');

        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', (e) => {
                this.filters.users.status = e.target.value;
                this.loadUsers();
            });
        }

        if (userTypeFilter) {
            userTypeFilter.addEventListener('change', (e) => {
                this.filters.users.type = e.target.value;
                this.loadUsers();
            });
        }

        if (userSearchInput) {
            userSearchInput.addEventListener('input', (e) => {
                this.filters.users.search = e.target.value;
                this.debounce(() => this.loadUsers(), 500)();
            });
        }

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.openUserModal();
            });
        }

        if (exportUsersBtn) {
            exportUsersBtn.addEventListener('click', () => {
                this.exportUsers();
            });
        }
    }

    setupBookManagement() {
        // Book filters
        const bookStatusFilter = document.getElementById('bookStatusFilter');
        const bookCategoryFilter = document.getElementById('bookCategoryFilter');
        const bookSearchInput = document.getElementById('bookSearchInput');
        const addBookBtn = document.getElementById('addBookBtn');
        const exportBooksBtn = document.getElementById('exportBooksBtn');

        if (bookStatusFilter) {
            bookStatusFilter.addEventListener('change', (e) => {
                this.filters.books.status = e.target.value;
                this.loadBooks();
            });
        }

        if (bookCategoryFilter) {
            bookCategoryFilter.addEventListener('change', (e) => {
                this.filters.books.category = e.target.value;
                this.loadBooks();
            });
        }

        if (bookSearchInput) {
            bookSearchInput.addEventListener('input', (e) => {
                this.filters.books.search = e.target.value;
                this.debounce(() => this.loadBooks(), 500)();
            });
        }

        if (addBookBtn) {
            addBookBtn.addEventListener('click', () => {
                this.openBookModal();
            });
        }

        if (exportBooksBtn) {
            exportBooksBtn.addEventListener('click', () => {
                this.exportBooks();
            });
        }
    }

    setupOrderManagement() {
        // Order filters
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        const orderDateFrom = document.getElementById('orderDateFrom');
        const orderDateTo = document.getElementById('orderDateTo');
        const orderSearchInput = document.getElementById('orderSearchInput');
        const exportOrdersBtn = document.getElementById('exportOrdersBtn');

        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', (e) => {
                this.filters.orders.status = e.target.value;
                this.loadOrders();
            });
        }

        if (orderDateFrom) {
            orderDateFrom.addEventListener('change', (e) => {
                this.filters.orders.dateFrom = e.target.value;
                this.loadOrders();
            });
        }

        if (orderDateTo) {
            orderDateTo.addEventListener('change', (e) => {
                this.filters.orders.dateTo = e.target.value;
                this.loadOrders();
            });
        }

        if (orderSearchInput) {
            orderSearchInput.addEventListener('input', (e) => {
                this.filters.orders.search = e.target.value;
                this.debounce(() => this.loadOrders(), 500)();
            });
        }

        if (exportOrdersBtn) {
            exportOrdersBtn.addEventListener('click', () => {
                this.exportOrders();
            });
        }
    }

    setupSettings() {
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings(settingsForm);
            });
        }
    }

    setupModals() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Save user button
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', () => {
                this.saveUser();
            });
        }

        // Modal dismiss buttons
        document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
    }

    setupChartControls() {
        // Chart period controls
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.updateChartPeriod(period, e.target);
            });
        });
    }

    setupDropdowns() {
        // User dropdown
        const userDropdown = document.querySelector('.admin-user .dropdown-toggle');
        const userDropdownMenu = document.querySelector('.admin-user .dropdown-menu');
        
        if (userDropdown && userDropdownMenu) {
            userDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                userDropdownMenu.style.display = userDropdownMenu.style.display === 'block' ? 'none' : 'block';
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'books':
                this.loadBooks();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'messages':
                this.loadMessages();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'logs':
                this.loadSystemLogs();
                break;
        }
    }

    async loadInitialData() {
        try {
            this.showNotification('Loading dashboard data...', 'info');
            await this.loadDashboardData();
            this.showNotification('Dashboard loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            const response = await apiFetch('/api/admin/dashboard/stats');
            this.data.dashboard = response;
            this.updateStatsCards();
            this.updateRecentActivity();
            this.updateCharts();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show fallback data if API fails
            this.showFallbackData();
        }
    }

    showFallbackData() {
        // Show a message that data couldn't be loaded
        const statsCards = document.querySelectorAll('.stat-card');
        statsCards.forEach(card => {
            const statNumber = card.querySelector('.stat-number');
            if (statNumber) {
                statNumber.textContent = 'N/A';
            }
        });
        
        this.showNotification('Could not load dashboard data. Please check if the backend server is running.', 'warning');
    }

    updateStatsCards() {
        if (!this.data.dashboard) return;

        const { users, books, revenue, reviews } = this.data.dashboard;

        // Get all stat number elements
        const statNumbers = document.querySelectorAll('.stat-card .stat-number');
        
        // Update user stats (first card)
        if (statNumbers.length > 0) {
            statNumbers[0].textContent = users?.total || 0;
        }

        // Update book stats (second card)
        if (statNumbers.length > 1) {
            statNumbers[1].textContent = books?.total || 0;
        }

        // Update order stats (third card)
        if (statNumbers.length > 2) {
            statNumbers[2].textContent = revenue?.totalSales || 0;
        }

        // Update revenue stats (fourth card)
        if (statNumbers.length > 3) {
            statNumbers[3].textContent = `₹${(revenue?.total || 0).toLocaleString()}`;
        }
    }

    updateRecentActivity() {
        if (!this.data.dashboard?.activity) return;

        const { recentUsers, recentBooks, topSellingBooks, mostViewedBooks } = this.data.dashboard.activity;
        const activityList = document.querySelector('.activity-list');

        if (activityList) {
            activityList.innerHTML = '';

            // Add recent users
            if (recentUsers && recentUsers.length > 0) {
                recentUsers.forEach(user => {
                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    activityItem.innerHTML = `
                        <div class="activity-icon new-user">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">New User Registered</div>
                            <div class="activity-desc">${user.firstName} ${user.lastName} (${user.accountType})</div>
                            <div class="activity-time">${new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                    `;
                    activityList.appendChild(activityItem);
                });
            }

            // Add recent books
            if (recentBooks && recentBooks.length > 0) {
                recentBooks.forEach(book => {
                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    activityItem.innerHTML = `
                        <div class="activity-icon new-book">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">New Book Added</div>
                            <div class="activity-desc">${book.title} by ${book.author}</div>
                            <div class="activity-time">${new Date(book.createdAt).toLocaleDateString()}</div>
                        </div>
                    `;
                    activityList.appendChild(activityItem);
                });
            }

            // If no activity, show a message
            if ((!recentUsers || recentUsers.length === 0) && (!recentBooks || recentBooks.length === 0)) {
                activityList.innerHTML = `
                    <div class="activity-item">
                        <div class="activity-content">
                            <div class="activity-title">No recent activity</div>
                            <div class="activity-desc">No new users or books in the last 24 hours</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    async loadUsers() {
        try {
            const params = new URLSearchParams({
                page: this.pagination.users.page,
                limit: this.pagination.users.limit,
                search: this.filters.users.search,
                status: this.filters.users.status,
                accountType: this.filters.users.type
            });

            const response = await apiFetch(`/api/admin/users?${params}`);
            this.data.users = response.users;
            this.pagination.users.total = response.pagination.totalUsers;
            this.renderUsers();
            this.updatePagination('users', response.pagination);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    async loadBooks() {
        try {
            const params = new URLSearchParams({
                page: this.pagination.books.page,
                limit: this.pagination.books.limit,
                search: this.filters.books.search,
                category: this.filters.books.category,
                status: this.filters.books.status
            });

            const response = await apiFetch(`/api/admin/books?${params}`);
            this.data.books = response.books;
            this.pagination.books.total = response.pagination.totalBooks;
            this.renderBooks();
            this.updatePagination('books', response.pagination);
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Error loading books', 'error');
        }
    }

    async loadOrders() {
        try {
            // Since we don't have a separate orders model, we'll use sold books as orders
            const params = new URLSearchParams({
                page: this.pagination.orders.page,
                limit: this.pagination.orders.limit,
                status: 'sold'
            });

            const response = await apiFetch(`/api/admin/books?${params}`);
            this.data.orders = response.books.filter(book => book.status === 'sold');
            this.pagination.orders.total = this.data.orders.length;
            this.renderOrders();
            this.updatePagination('orders', { totalItems: this.data.orders.length });
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders', 'error');
        }
    }

    async loadReviews() {
        try {
            const params = new URLSearchParams({
                page: this.pagination.reviews.page,
                limit: this.pagination.reviews.limit
            });

            const response = await apiFetch(`/api/admin/reviews?${params}`);
            this.data.reviews = response.reviews;
            this.pagination.reviews.total = response.pagination.totalReviews;
            this.renderReviews();
            this.updatePagination('reviews', response.pagination);
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showNotification('Error loading reviews', 'error');
        }
    }

    renderUsers() {
        const usersTable = document.querySelector('#usersTable tbody');
        if (!usersTable) return;

        usersTable.innerHTML = '';

        if (!this.data.users || this.data.users.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <div class="no-data-message">
                            <i class="fas fa-users"></i>
                            <p>No users found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.data.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" value="${user._id}">
                </td>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || '/assets/images/default-avatar.png'}" alt="${user.firstName}" class="user-avatar">
                        <div>
                            <div class="user-name">${user.firstName} ${user.lastName}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.accountType || 'buyer'}</td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.stats?.totalBooks || 0}</td>
                <td>${user.stats?.soldBooks || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewUser('${user._id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editUser('${user._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteUser('${user._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            usersTable.appendChild(row);
        });
    }

    renderBooks() {
        const booksTable = document.querySelector('#booksTable tbody');
        if (!booksTable) return;

        booksTable.innerHTML = '';

        if (!this.data.books || this.data.books.length === 0) {
            booksTable.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <div class="no-data-message">
                            <i class="fas fa-book"></i>
                            <p>No books found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.data.books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" value="${book._id}">
                </td>
                <td>
                    <div class="book-info">
                        <img src="${book.coverImage || '/assets/images/placeholder-book.jpg'}" alt="${book.title}" class="book-cover">
                        <div>
                            <div class="book-title">${book.title}</div>
                            <div class="book-author">by ${book.author}</div>
                        </div>
                    </div>
                </td>
                <td>${book.author}</td>
                <td>${book.category || 'General'}</td>
                <td>₹${book.price || 0}</td>
                <td>${book.seller?.firstName} ${book.seller?.lastName || 'Unknown'}</td>
                <td>
                    <span class="status-badge ${book.status || 'available'}">
                        ${(book.status || 'available').charAt(0).toUpperCase() + (book.status || 'available').slice(1)}
                    </span>
                </td>
                <td>${new Date(book.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewBook('${book._id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editBook('${book._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteBook('${book._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            booksTable.appendChild(row);
        });
    }

    renderOrders() {
        const ordersTable = document.querySelector('#ordersTable tbody');
        if (!ordersTable) return;

        ordersTable.innerHTML = '';

        if (!this.data.orders || this.data.orders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <div class="no-data-message">No orders found</div>
                    </td>
                </tr>
            `;
            return;
        }

        this.data.orders.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="book-info">
                        <img src="${book.coverImage || '/assets/images/placeholder-book.jpg'}" alt="${book.title}" class="book-cover">
                        <div>
                            <div class="book-title">${book.title}</div>
                            <div class="book-author">by ${book.author}</div>
                        </div>
                    </div>
                </td>
                <td>₹${book.soldPrice || book.price}</td>
                <td>${book.seller?.firstName} ${book.seller?.lastName}</td>
                <td>${book.soldTo?.firstName} ${book.soldTo?.lastName}</td>
                <td>${new Date(book.soldDate).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge sold">Sold</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewOrder('${book._id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            ordersTable.appendChild(row);
        });
    }

    renderReviews() {
        const reviewsTable = document.querySelector('#reviewsTable tbody');
        if (!reviewsTable) return;

        reviewsTable.innerHTML = '';

        this.data.reviews.forEach(review => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="review-info">
                        <div class="review-title">${review.bookTitle}</div>
                        <div class="review-author">by ${review.reviewerName}</div>
                    </div>
                </td>
                <td>
                    <div class="rating-stars">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </td>
                <td>${review.comment || 'No comment'}</td>
                <td>${review.sellerName}</td>
                <td>${new Date(review.reviewDate).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewReview('${review.bookId}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            reviewsTable.appendChild(row);
        });
    }

    updatePagination(type, pagination) {
        const paginationContainer = document.querySelector(`#${type}Pagination`);
        if (!paginationContainer) return;

        const { currentPage, totalPages, totalItems } = pagination;
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing ${((currentPage - 1) * this.pagination[type].limit) + 1} to ${Math.min(currentPage * this.pagination[type].limit, totalItems)} of ${totalItems} items
            </div>
            <div class="pagination">
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.adminDashboard.changePage('${type}', ${currentPage - 1})">
                    Previous
                </button>
                ${this.generatePageNumbers(currentPage, totalPages, type)}
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.adminDashboard.changePage('${type}', ${currentPage + 1})">
                    Next
                </button>
            </div>
        `;
    }

    generatePageNumbers(currentPage, totalPages, type) {
        let pages = '';
        const maxPages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.adminDashboard.changePage('${type}', ${i})">
                    ${i}
                </button>
            `;
        }

        return pages;
    }

    changePage(type, page) {
        this.pagination[type].page = page;
        this.loadTabData(type);
    }

    initializeCharts() {
        // Initialize charts when dashboard data is loaded
        this.updateCharts();
    }

    updateCharts() {
        if (!this.data.dashboard?.analytics) return;

        this.updateRevenueChart();
        this.updateUserGrowthChart();
    }

    updateRevenueChart() {
        const chartContainer = document.getElementById('revenueChart');
        if (!chartContainer) return;

        const { monthlyRevenue } = this.data.dashboard.analytics;
        
        // Create a simple chart using CSS or a charting library
        // For now, we'll create a simple visualization
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <h4>Revenue Trend (Last 6 Months)</h4>
                <div class="chart-bars">
                    ${monthlyRevenue.map(item => `
                        <div class="chart-bar">
                            <div class="bar-fill" style="height: ${(item.revenue / Math.max(...monthlyRevenue.map(r => r.revenue))) * 100}%"></div>
                            <div class="bar-label">₹${item.revenue.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateUserGrowthChart() {
        const chartContainer = document.getElementById('userGrowthChart');
        if (!chartContainer) return;

        const { monthlyUserGrowth } = this.data.dashboard.analytics;
        
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <h4>User Growth (Last 6 Months)</h4>
                <div class="chart-bars">
                    ${monthlyUserGrowth.map(item => `
                        <div class="chart-bar">
                            <div class="bar-fill" style="height: ${(item.count / Math.max(...monthlyUserGrowth.map(u => u.count))) * 100}%"></div>
                            <div class="bar-label">${item.count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateChartPeriod(period, button) {
        // Update active button
        document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Reload analytics with new period
        this.loadAnalyticsData(period);
    }

    async loadAnalyticsData(period = 'month') {
        try {
            const response = await apiFetch(`/api/admin/analytics?period=${period}`);
            this.data.analytics = response;
            this.updateCharts();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showNotification('Error loading analytics', 'error');
        }
    }

    openUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        if (!modal) return;

        if (userId) {
            // Edit existing user
            const user = this.data.users.find(u => u._id === userId);
            if (user) {
                document.getElementById('userFirstName').value = user.firstName;
                document.getElementById('userLastName').value = user.lastName;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userAccountType').value = user.accountType;
                document.getElementById('userModalTitle').textContent = 'Edit User';
                document.getElementById('userModalSubmit').textContent = 'Update User';
            }
        } else {
            // Create new user
            document.getElementById('userModalTitle').textContent = 'Create New User';
            document.getElementById('userModalSubmit').textContent = 'Create User';
            document.getElementById('userForm').reset();
        }

        modal.classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async saveUser() {
        try {
            const formData = new FormData(document.getElementById('userForm'));
            const userData = Object.fromEntries(formData.entries());

            const response = await apiFetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            this.showNotification('User saved successfully!', 'success');
            this.closeModals();
            this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            this.showNotification('Error saving user', 'error');
        }
    }

    async viewUser(userId) {
        try {
            const response = await apiFetch(`/api/admin/users/${userId}`);
            const user = response.user;
            
            // Show user details in a modal
            this.showUserDetailsModal(user);
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showNotification('Error loading user details', 'error');
        }
    }

    showUserDetailsModal(user) {
        const modal = document.getElementById('userDetailsModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>User Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-details">
                        <div class="user-avatar">
                            <img src="${user.avatar || '/assets/images/default-avatar.png'}" alt="${user.firstName}">
                        </div>
                        <div class="user-info">
                            <h4>${user.firstName} ${user.lastName}</h4>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Account Type:</strong> ${user.accountType}</p>
                            <p><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</p>
                            <p><strong>Member Since:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div class="user-stats">
                            <h5>Statistics</h5>
                            <p><strong>Total Books:</strong> ${user.stats?.totalBooks || 0}</p>
                            <p><strong>Sold Books:</strong> ${user.stats?.soldBooks || 0}</p>
                            <p><strong>Total Revenue:</strong> ₹${user.stats?.totalRevenue || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    async editUser(userId) {
        // Load user data and open edit modal
        try {
            const response = await apiFetch(`/api/admin/users/${userId}`);
            const user = response.user;
            
            // Populate form with user data
            document.getElementById('userFirstName').value = user.firstName;
            document.getElementById('userLastName').value = user.lastName;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userAccountType').value = user.accountType;
            
            // Update modal for editing
            document.getElementById('userModalTitle').textContent = 'Edit User';
            document.getElementById('userModalSubmit').textContent = 'Update User';
            
            // Store user ID for update
            document.getElementById('userForm').dataset.userId = userId;
            
            document.getElementById('userModal').classList.add('active');
        } catch (error) {
            console.error('Error loading user for edit:', error);
            this.showNotification('Error loading user data', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await apiFetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            this.showNotification('User deleted successfully!', 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        }
    }

    async viewBook(bookId) {
        try {
            const book = this.data.books.find(b => b._id === bookId);
            if (book) {
                this.showBookDetailsModal(book);
            }
        } catch (error) {
            console.error('Error loading book details:', error);
            this.showNotification('Error loading book details', 'error');
        }
    }

    showBookDetailsModal(book) {
        const modal = document.getElementById('bookDetailsModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Book Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="book-details">
                        <div class="book-cover">
                            <img src="${book.coverImage || '/assets/images/placeholder-book.jpg'}" alt="${book.title}">
                        </div>
                        <div class="book-info">
                            <h4>${book.title}</h4>
                            <p><strong>Author:</strong> ${book.author}</p>
                            <p><strong>Category:</strong> ${book.category}</p>
                            <p><strong>Price:</strong> ₹${book.price}</p>
                            <p><strong>Status:</strong> ${book.status}</p>
                            <p><strong>Seller:</strong> ${book.seller?.firstName} ${book.seller?.lastName}</p>
                            <p><strong>Added:</strong> ${new Date(book.createdAt).toLocaleDateString()}</p>
                            <p><strong>Views:</strong> ${book.views}</p>
                            <p><strong>Likes:</strong> ${book.likes}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    async editBook(bookId) {
        // Implementation for editing books
        console.log('Edit book:', bookId);
    }

    async deleteBook(bookId) {
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }

        try {
            await apiFetch(`/api/admin/books/${bookId}`, {
                method: 'DELETE'
            });

            this.showNotification('Book deleted successfully!', 'success');
            this.loadBooks();
        } catch (error) {
            console.error('Error deleting book:', error);
            this.showNotification('Error deleting book', 'error');
        }
    }

    async viewOrder(orderId) {
        // Implementation for viewing orders
        console.log('View order:', orderId);
    }

    async updateOrderStatus(orderId) {
        // Implementation for updating order status
        console.log('Update order status:', orderId);
    }

    async viewReport(reportId) {
        // Implementation for viewing reports
        console.log('View report:', reportId);
        this.showNotification('Viewing report: ' + reportId, 'info');
    }

    async resolveReport(reportId) {
        // Implementation for resolving reports
        console.log('Resolve report:', reportId);
        this.showNotification('Report resolved: ' + reportId, 'success');
    }

    async viewMessage(messageId) {
        // Implementation for viewing messages
        console.log('View message:', messageId);
        this.showNotification('Viewing message: ' + messageId, 'info');
    }

    async deleteMessage(messageId) {
        // Implementation for deleting messages
        console.log('Delete message:', messageId);
        this.showNotification('Message deleted: ' + messageId, 'success');
    }

    async viewReview(reviewId) {
        // Implementation for viewing reviews
        console.log('View review:', reviewId);
        this.showNotification('Viewing review: ' + reviewId, 'info');
    }

    async exportUsers() {
        try {
            const response = await apiFetch('/api/admin/users?limit=1000');
            const csvContent = this.generateCSV(response.users, [
                'First Name', 'Last Name', 'Email', 'Account Type', 'Status', 'Created At'
            ]);
            this.downloadCSV(csvContent, 'users_export.csv');
        } catch (error) {
            console.error('Error exporting users:', error);
            this.showNotification('Error exporting users', 'error');
        }
    }

    async exportBooks() {
        try {
            const response = await apiFetch('/api/admin/books?limit=1000');
            const csvContent = this.generateCSV(response.books, [
                'Title', 'Author', 'Category', 'Price', 'Status', 'Seller', 'Created At'
            ]);
            this.downloadCSV(csvContent, 'books_export.csv');
        } catch (error) {
            console.error('Error exporting books:', error);
            this.showNotification('Error exporting books', 'error');
        }
    }

    async exportOrders() {
        try {
            const response = await apiFetch('/api/admin/books?status=sold&limit=1000');
            const orders = response.books.filter(book => book.status === 'sold');
            const csvContent = this.generateCSV(orders, [
                'Book Title', 'Author', 'Price', 'Seller', 'Buyer', 'Sold Date'
            ]);
            this.downloadCSV(csvContent, 'orders_export.csv');
        } catch (error) {
            console.error('Error exporting orders:', error);
            this.showNotification('Error exporting orders', 'error');
        }
    }

    generateCSV(data, headers) {
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
            const values = headers.map(header => {
                const value = this.getNestedValue(item, header.toLowerCase().replace(/\s+/g, ''));
                return `"${value || ''}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    getNestedValue(obj, key) {
        const keys = key.split('.');
        return keys.reduce((current, key) => current?.[key], obj);
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async saveSettings(form) {
        try {
            const formData = new FormData(form);
            const settings = Object.fromEntries(formData.entries());
            
            // Save settings logic here
            console.log('Saving settings:', settings);
            
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    handleGlobalSearch(query) {
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        // Search across all data types
        const results = [];
        
        // Search users
        this.data.users?.forEach(user => {
            if (user.firstName.toLowerCase().includes(query.toLowerCase()) ||
                user.lastName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'user',
                    title: `${user.firstName} ${user.lastName}`,
                    subtitle: user.email,
                    data: user
                });
            }
        });

        // Search books
        this.data.books?.forEach(book => {
            if (book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'book',
                    title: book.title,
                    subtitle: `by ${book.author}`,
                    data: book
                });
            }
        });

        this.showSearchResults(results);
    }

    showSearchResults(results) {
        let searchResultsContainer = document.getElementById('searchResults');
        if (!searchResultsContainer) {
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'searchResults';
            searchResultsContainer.className = 'search-results';
            document.querySelector('.search-container').appendChild(searchResultsContainer);
        }

        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="no-results">No results found</div>';
        } else {
            const resultsList = results.map(result => `
                <div class="search-result-item" onclick="window.adminDashboard.handleSearchResult('${result.type}', '${result.data._id}')">
                    <div class="result-icon">
                        <i class="fas fa-${result.type === 'user' ? 'user' : 'book'}"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">${result.title}</div>
                        <div class="result-subtitle">${result.subtitle}</div>
                    </div>
                </div>
            `).join('');
            
            searchResultsContainer.innerHTML = resultsList;
        }
        
        searchResultsContainer.style.display = 'block';
    }

    hideSearchResults() {
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.style.display = 'none';
        }
    }

    handleSearchResult(type, id) {
        this.hideSearchResults();
        if (type === 'user') {
            this.switchTab('users');
            // You could also highlight the specific user
        } else if (type === 'book') {
            this.switchTab('books');
            // You could also highlight the specific book
        }
    }

    toggleNotifications() {
        let notificationsContainer = document.getElementById('notificationsDropdown');
        if (!notificationsContainer) {
            notificationsContainer = document.createElement('div');
            notificationsContainer.id = 'notificationsDropdown';
            notificationsContainer.className = 'notifications-dropdown';
            document.querySelector('.notification-bell').appendChild(notificationsContainer);
        }

        const isVisible = notificationsContainer.style.display === 'block';
        
        if (isVisible) {
            notificationsContainer.style.display = 'none';
        } else {
            // Mock notifications
            const notifications = [
                { id: 1, message: 'New user registered', time: '2 minutes ago', type: 'info' },
                { id: 2, message: 'New book listed', time: '5 minutes ago', type: 'success' },
                { id: 3, message: 'System maintenance scheduled', time: '1 hour ago', type: 'warning' }
            ];

            const notificationsList = notifications.map(notification => `
                <div class="notification-item ${notification.type}">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            `).join('');

            notificationsContainer.innerHTML = `
                <div class="notifications-header">
                    <h4>Notifications</h4>
                    <button onclick="window.adminDashboard.markAllAsRead()">Mark all as read</button>
                </div>
                <div class="notifications-list">
                    ${notificationsList}
                </div>
            `;
            
            notificationsContainer.style.display = 'block';
        }
    }

    markAllAsRead() {
        const notificationCount = document.querySelector('.notification-count');
        if (notificationCount) {
            notificationCount.textContent = '0';
            notificationCount.style.display = 'none';
        }
        this.toggleNotifications();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    checkAdminAuth() {
        const token = sessionStorage.getItem('adminToken');
        if (!token) {
            return false;
        }
        
        // Check if token is expired (24 hours)
        const loginTime = sessionStorage.getItem('adminLoginTime');
        if (loginTime) {
            const now = Date.now();
            const loginTimestamp = parseInt(loginTime);
            if (now - loginTimestamp > 24 * 60 * 60 * 1000) {
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminLoginTime');
                return false;
            }
        }
        
        return true;
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminLoginTime');
            sessionStorage.removeItem('adminJustLoggedIn');
            window.location.href = 'admin-login.html';
        }
    }

    updateDashboardPeriod(period) {
        this.loadAnalytics(period);
    }

    loadAnalytics() {
        this.loadAnalyticsData();
    }

    handleBulkUserAction(action) {
        const selectedUsers = Array.from(document.querySelectorAll('#usersTable input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedUsers.length === 0) {
            this.showNotification('Please select users to perform bulk action', 'warning');
            return;
        }

        switch (action) {
            case 'activate':
                this.bulkUpdateUserStatus(selectedUsers, true);
                break;
            case 'deactivate':
                this.bulkUpdateUserStatus(selectedUsers, false);
                break;
            case 'delete':
                this.bulkDeleteUsers(selectedUsers);
                break;
        }
    }

    async bulkUpdateUserStatus(userIds, status) {
        try {
            await Promise.all(userIds.map(userId =>
                apiFetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ isActive: status })
                })
            ));

            this.showNotification(`Users ${status ? 'activated' : 'deactivated'} successfully!`, 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showNotification('Error updating user status', 'error');
        }
    }

    async bulkDeleteUsers(userIds) {
        if (!confirm(`Are you sure you want to delete ${userIds.length} users? This action cannot be undone.`)) {
            return;
        }

        try {
            await Promise.all(userIds.map(userId =>
                apiFetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE'
                })
            ));

            this.showNotification('Users deleted successfully!', 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting users:', error);
            this.showNotification('Error deleting users', 'error');
        }
    }

    setupSelectAll() {
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }
    }

    checkSystemStatus() {
        // Check if backend is running
        fetch('/api/admin/dashboard/stats')
            .then(response => {
                if (!response.ok) {
                    this.showNotification('Backend connection issue', 'warning');
                }
            })
            .catch(error => {
                this.showNotification('Backend is not responding', 'error');
            });
    }

    startRealTimeUpdates() {
        // Refresh dashboard data every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }

    openBookModal(bookId = null) {
        // Implementation for book modal
        console.log('Open book modal:', bookId);
    }

    // Load Categories
    async loadCategories() {
        try {
            const response = await apiFetch('/api/admin/books');
            const categories = {};
            response.books.forEach(book => {
                if (book.category) {
                    categories[book.category] = (categories[book.category] || 0) + 1;
                }
            });
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Error loading categories', 'error');
        }
    }

    renderCategories(categories) {
        const categoriesContainer = document.querySelector('#categories');
        if (!categoriesContainer) return;

        const categoriesList = Object.entries(categories).map(([category, count]) => `
            <div class="category-item">
                <div class="category-name">${category}</div>
                <div class="category-count">${count} books</div>
            </div>
        `).join('');

        categoriesContainer.innerHTML = `
            <div class="content-header">
                <div class="header-info">
                    <h1>Categories</h1>
                    <p>Manage book categories</p>
                </div>
            </div>
            <div class="categories-grid">
                ${categoriesList}
            </div>
        `;
    }

    // Load Reports
    async loadReports() {
        try {
            // Mock reports data
            const reports = [
                { id: 1, type: 'Inappropriate Content', item: 'Book: "Test Book"', reporter: 'user@example.com', reason: 'Contains inappropriate content', priority: 'High', date: new Date(), status: 'Pending' },
                { id: 2, type: 'Spam', item: 'User: "spammer"', reporter: 'admin@example.com', reason: 'Sending spam messages', priority: 'Medium', date: new Date(), status: 'Resolved' }
            ];
            this.renderReports(reports);
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showNotification('Error loading reports', 'error');
        }
    }

    renderReports(reports) {
        const reportsContainer = document.querySelector('#reports');
        if (!reportsContainer) return;

        const reportsList = reports.map(report => `
            <tr>
                <td>${report.id}</td>
                <td>${report.type}</td>
                <td>${report.item}</td>
                <td>${report.reporter}</td>
                <td>${report.reason}</td>
                <td><span class="priority-badge ${report.priority.toLowerCase()}">${report.priority}</span></td>
                <td>${report.date.toLocaleDateString()}</td>
                <td><span class="status-badge ${report.status.toLowerCase()}">${report.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewReport('${report.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="resolveReport('${report.id}')" title="Resolve">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        reportsContainer.innerHTML = `
            <div class="content-header">
                <div class="header-info">
                    <h1>Reports & Issues</h1>
                    <p>Review reported content and user issues</p>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Type</th>
                            <th>Reported Item</th>
                            <th>Reporter</th>
                            <th>Reason</th>
                            <th>Priority</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportsList}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Load Messages
    async loadMessages() {
        try {
            // Mock messages data
            const messages = [
                { id: 1, from: 'user@example.com', subject: 'Help needed', message: 'I need help with my account', date: new Date(), status: 'Unread' },
                { id: 2, from: 'seller@example.com', subject: 'Book listing issue', message: 'Cannot upload book cover', date: new Date(), status: 'Read' }
            ];
            this.renderMessages(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Error loading messages', 'error');
        }
    }

    renderMessages(messages) {
        const messagesContainer = document.querySelector('#messages');
        if (!messagesContainer) return;

        const messagesList = messages.map(msg => `
            <tr>
                <td>${msg.from}</td>
                <td>${msg.subject}</td>
                <td>${msg.message.substring(0, 50)}...</td>
                <td>${msg.date.toLocaleDateString()}</td>
                <td><span class="status-badge ${msg.status.toLowerCase()}">${msg.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewMessage('${msg.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteMessage('${msg.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        messagesContainer.innerHTML = `
            <div class="content-header">
                <div class="header-info">
                    <h1>Messages</h1>
                    <p>Manage user messages and support requests</p>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>From</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${messagesList}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Load Settings
    loadSettings() {
        const settingsContainer = document.querySelector('#settings');
        if (!settingsContainer) return;

        settingsContainer.innerHTML = `
            <div class="content-header">
                <div class="header-info">
                    <h1>System Settings</h1>
                    <p>Configure platform settings and preferences</p>
                </div>
            </div>
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>General Settings</h3>
                    <form class="settings-form">
                        <div class="form-group">
                            <label>Site Name</label>
                            <input type="text" value="LibroLink">
                        </div>
                        <div class="form-group">
                            <label>Site Description</label>
                            <textarea rows="3">Your trusted marketplace for buying and selling books.</textarea>
                        </div>
                        <div class="form-group">
                            <label>Commission Rate (%)</label>
                            <input type="number" value="5" min="0" max="100">
                        </div>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </form>
                </div>
            </div>
        `;
    }

    // Load System Logs
    async loadSystemLogs() {
        try {
            // Mock logs data
            const logs = [
                { id: 1, level: 'INFO', message: 'Server started successfully', timestamp: new Date() },
                { id: 2, level: 'WARNING', message: 'High memory usage detected', timestamp: new Date() },
                { id: 3, level: 'ERROR', message: 'Database connection failed', timestamp: new Date() }
            ];
            this.renderSystemLogs(logs);
        } catch (error) {
            console.error('Error loading system logs:', error);
            this.showNotification('Error loading system logs', 'error');
        }
    }

    renderSystemLogs(logs) {
        const logsContainer = document.querySelector('#logs');
        if (!logsContainer) return;

        const logsList = logs.map(log => `
            <tr>
                <td><span class="log-level ${log.level.toLowerCase()}">${log.level}</span></td>
                <td>${log.message}</td>
                <td>${log.timestamp.toLocaleString()}</td>
            </tr>
        `).join('');

        logsContainer.innerHTML = `
            <div class="content-header">
                <div class="header-info">
                    <h1>System Logs</h1>
                    <p>View system logs and error reports</p>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Message</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logsList}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// API fetch function with authentication
async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem('adminToken');
    const baseURL = 'http://localhost:3001'; // Backend server URL
    const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(fullURL, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

// Global functions for onclick handlers
function viewUser(userId) { window.adminDashboard.viewUser(userId); }
function editUser(userId) { window.adminDashboard.editUser(userId); }
function deleteUser(userId) { window.adminDashboard.deleteUser(userId); }
function viewBook(bookId) { window.adminDashboard.viewBook(bookId); }
function editBook(bookId) { window.adminDashboard.editBook(bookId); }
function deleteBook(bookId) { window.adminDashboard.deleteBook(bookId); }
function viewOrder(orderId) { window.adminDashboard.viewOrder(orderId); }
function updateOrderStatus(orderId) { window.adminDashboard.updateOrderStatus(orderId); }
function viewReport(reportId) { window.adminDashboard.viewReport(reportId); }
function resolveReport(reportId) { window.adminDashboard.resolveReport(reportId); }
function viewMessage(messageId) { window.adminDashboard.viewMessage(messageId); }
function deleteMessage(messageId) { window.adminDashboard.deleteMessage(messageId); }
function viewReview(reviewId) { window.adminDashboard.viewReview(reviewId); }

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});