class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.currentTab = 'personal-info';
        this.userData = {};
        this.orders = [];
        this.addresses = [];
        this.paymentMethods = [];
        this.isEditMode = false;
        
        this.init();
    }

    init() {
        this.checkAuthStatus();
        if (!this.isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }
        
        this.loadUserData();
        this.setupTabNavigation();
        this.bindEvents();
        this.loadTabContent();
        this.updateProfileStats();
    }

    checkAuthStatus() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                this.isLoggedIn = true;
                console.log('User logged in:', this.currentUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.isLoggedIn = false;
            }
        } else {
            this.isLoggedIn = false;
        }
    }

    loadUserData() {
        // Load user data from localStorage or set defaults
        const userDataStr = localStorage.getItem(`userData_${this.currentUser.email}`);
        if (userDataStr) {
            try {
                this.userData = JSON.parse(userDataStr);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.userData = {};
            }
        }

        // Set default values if not present
        this.userData = {
            firstName: this.currentUser.firstName || '',
            lastName: this.currentUser.lastName || '',
            email: this.currentUser.email || '',
            username: this.currentUser.username || this.currentUser.email?.split('@')[0] || '',
            bio: this.userData.bio || '',
            phone: this.userData.phone || '',
            birthdate: this.userData.birthdate || '',
            accountType: this.userData.accountType || 'buyer',
            notifications: this.userData.notifications || {
                orderUpdates: true,
                newBooks: true,
                promotions: false,
                newsletter: true,
                pushOrders: true,
                pushMessages: false,
                pushWishlist: true
            },
            ...this.userData
        };

        this.populateFormFields();
    }

    populateFormFields() {
        // Personal Information
        document.getElementById('firstName').value = this.userData.firstName;
        document.getElementById('lastName').value = this.userData.lastName;
        document.getElementById('email').value = this.userData.email;
        document.getElementById('username').value = this.userData.username;
        document.getElementById('bio').value = this.userData.bio;
        document.getElementById('phone').value = this.userData.phone;
        document.getElementById('birthdate').value = this.userData.birthdate;

        // Account Type
        const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
        accountTypeRadios.forEach(radio => {
            if (radio.value === this.userData.accountType) {
                radio.checked = true;
            }
        });

        // Notifications
        const notificationCheckboxes = document.querySelectorAll('#notificationsForm input[type="checkbox"]');
        notificationCheckboxes.forEach(checkbox => {
            if (this.userData.notifications && this.userData.notifications[checkbox.name] !== undefined) {
                checkbox.checked = this.userData.notifications[checkbox.name];
            }
        });

        // Update profile display
        this.updateProfileDisplay();
    }

    updateProfileDisplay() {
        const profileName = document.getElementById('profileName');
        const profileUsername = document.getElementById('profileUsername');
        const userDisplayName = document.getElementById('userDisplayName');

        if (profileName) {
            profileName.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
        }
        if (profileUsername) {
            profileUsername.textContent = `@${this.userData.username}`;
        }
        if (userDisplayName) {
            userDisplayName.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
        }
    }

    setupTabNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-content');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Update menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.loadTabContent();
        
        // Reset edit mode when switching tabs
        if (this.isEditMode) {
            this.cancelEditMode();
        }
    }

    loadTabContent() {
        switch (this.currentTab) {
            case 'order-history':
                this.loadOrderHistory();
                break;
            case 'addresses':
                this.loadAddresses();
                break;
            case 'payment-methods':
                this.loadPaymentMethods();
                break;
        }
    }

    bindEvents() {
        // Personal Information Edit Mode
        const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn');
        const cancelPersonalInfoBtn = document.getElementById('cancelPersonalInfoBtn');
        
        if (editPersonalInfoBtn && !editPersonalInfoBtn.hasAttribute('data-bound')) {
            editPersonalInfoBtn.setAttribute('data-bound', 'true');
            editPersonalInfoBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }
        
        if (cancelPersonalInfoBtn && !cancelPersonalInfoBtn.hasAttribute('data-bound')) {
            cancelPersonalInfoBtn.setAttribute('data-bound', 'true');
            cancelPersonalInfoBtn.addEventListener('click', () => {
                this.cancelEditMode();
            });
        }

        // Danger Zone Buttons
        this.updateDangerZoneButtons();
        const deactivateBtn = document.getElementById('deactivateBtn');
        const activateBtn = document.getElementById('activateBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        
        if (deactivateBtn && !deactivateBtn.hasAttribute('data-bound')) {
            deactivateBtn.setAttribute('data-bound', 'true');
            deactivateBtn.addEventListener('click', () => {
                this.showDeactivateModal();
            });
        }
        if (activateBtn && !activateBtn.hasAttribute('data-bound')) {
            activateBtn.setAttribute('data-bound', 'true');
            activateBtn.addEventListener('click', () => {
                this.activateAccount();
            });
        }
        if (deleteBtn && !deleteBtn.hasAttribute('data-bound')) {
            deleteBtn.setAttribute('data-bound', 'true');
            deleteBtn.addEventListener('click', () => {
                this.showDeleteModal();
            });
        }

        // Confirmation Buttons
        const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
        const activateAccountBtn = document.getElementById('activateAccountBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        
        if (deactivateAccountBtn && !deactivateAccountBtn.hasAttribute('data-bound')) {
            deactivateAccountBtn.setAttribute('data-bound', 'true');
            deactivateAccountBtn.addEventListener('click', () => {
                this.deactivateAccount();
            });
        }
        
        if (activateAccountBtn && !activateAccountBtn.hasAttribute('data-bound')) {
            activateAccountBtn.setAttribute('data-bound', 'true');
            activateAccountBtn.addEventListener('click', () => {
                this.activateAccount();
            });
        }
        
        if (confirmDeleteBtn && !confirmDeleteBtn.hasAttribute('data-bound')) {
            confirmDeleteBtn.setAttribute('data-bound', 'true');
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteAccount();
            });
        }

        // Delete Confirmation Input
        const deleteConfirmation = document.getElementById('deleteConfirmation');
        if (deleteConfirmation) {
            deleteConfirmation.addEventListener('input', (e) => {
                const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.disabled = e.target.value !== 'DELETE';
                }
            });
        }

        // Personal Information Form
        const personalInfoForm = document.getElementById('personalInfoForm');
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePersonalInfo();
            });
        }

        // Password Form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Notifications Form
        const notificationsForm = document.getElementById('notificationsForm');
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationPreferences();
            });
        }

        // Account Type Changes
        const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
        accountTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.userData.accountType = e.target.value;
                this.saveUserData();
            });
        });

        // Bind modal events
        this.bindModalEvents();

        // Avatar Upload
        const avatarEditBtn = document.getElementById('avatarEditBtn');
        if (avatarEditBtn) {
            avatarEditBtn.addEventListener('click', () => {
                this.showAvatarModal();
            });
        }

        // Address Management
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', () => {
                this.showAddAddressModal();
            });
        }

        // Payment Method Management
        const addPaymentBtn = document.getElementById('addPaymentBtn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => {
                this.showAddPaymentModal();
            });
        }

        // Modal Events
        this.bindModalEvents();
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        const editBtn = document.getElementById('editPersonalInfoBtn');
        const actionsDiv = document.getElementById('personalInfoActions');
        const inputs = document.querySelectorAll('#personalInfoForm input:not([readonly]), #personalInfoForm textarea');
        
        if (this.isEditMode) {
            // Enable edit mode
            editBtn.innerHTML = '<i class="fas fa-eye"></i> View';
            editBtn.classList.remove('btn-outline');
            editBtn.classList.add('btn-secondary');
            actionsDiv.style.display = 'flex';
            
            inputs.forEach(input => {
                input.disabled = false;
            });
        } else {
            // Disable edit mode
            this.cancelEditMode();
        }
    }

    cancelEditMode() {
        this.isEditMode = false;
        
        const editBtn = document.getElementById('editPersonalInfoBtn');
        const actionsDiv = document.getElementById('personalInfoActions');
        const inputs = document.querySelectorAll('#personalInfoForm input:not([readonly]), #personalInfoForm textarea');
        
        // Reset button
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-outline');
        actionsDiv.style.display = 'none';
        
        // Disable inputs and reset values
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Reload original data
        this.populateFormFields();
    }

    savePersonalInfo() {
        const formData = new FormData(document.getElementById('personalInfoForm'));
        
        this.userData.firstName = formData.get('firstName');
        this.userData.lastName = formData.get('lastName');
        this.userData.username = formData.get('username');
        this.userData.bio = formData.get('bio');
        this.userData.phone = formData.get('phone');
        this.userData.birthdate = formData.get('birthdate');

        this.saveUserData();
        this.updateProfileDisplay();
        this.toggleEditMode(); // Exit edit mode
        this.showToast('Personal information updated successfully!', 'success');
    }

    showDeactivateModal() {
        const deactivateModal = document.getElementById('deactivateModal');
        if (deactivateModal) {
            deactivateModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    showDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Reset confirmation input
            const deleteConfirmation = document.getElementById('deleteConfirmation');
            if (deleteConfirmation) {
                deleteConfirmation.value = '';
            }
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.disabled = true;
            }
        }
    }

    async deactivateAccount() {
        try {
            const response = await fetch('/api/users/deactivate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Account deactivated successfully', 'success');
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateDangerZoneButtons();
                this.hideModals();
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showToast(data.error || 'Failed to deactivate account', 'error');
            }
        } catch (error) {
            console.error('Error deactivating account:', error);
            this.showToast('An error occurred while deactivating account', 'error');
        }
    }

    async activateAccount() {
        try {
            const response = await fetch('/api/users/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Account activated successfully', 'success');
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateDangerZoneButtons();
                this.hideModals();
            } else {
                this.showToast(data.error || 'Failed to activate account', 'error');
            }
        } catch (error) {
            console.error('Error activating account:', error);
            this.showToast('An error occurred while activating account', 'error');
        }
    }

    async deleteAccount() {
        const password = document.getElementById('deleteConfirmation').value;
        
        if (password !== 'DELETE') {
            this.showToast('Please type "DELETE" to confirm account deletion', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Account deleted successfully', 'success');
                
                // Clear all user data from localStorage
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');
                
                // Clear user-specific cart and wishlist data
                if (this.currentUser) {
                    const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
                    localStorage.removeItem(`cart_${userId}`);
                    localStorage.removeItem(`wishlist_${userId}`);
                }
                
                // Redirect to home page immediately
                window.location.href = '/';
            } else {
                this.showToast(data.error || 'Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showToast('An error occurred while deleting account', 'error');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showToast('New password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Password changed successfully', 'success');
                // Clear password fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
            } else {
                this.showToast(data.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showToast('An error occurred while changing password', 'error');
        }
    }

    saveNotificationPreferences() {
        const formData = new FormData(document.getElementById('notificationsForm'));
        
        this.userData.notifications = {
            orderUpdates: formData.get('orderUpdates') === 'on',
            newBooks: formData.get('newBooks') === 'on',
            promotions: formData.get('promotions') === 'on',
            newsletter: formData.get('newsletter') === 'on',
            pushOrders: formData.get('pushOrders') === 'on',
            pushMessages: formData.get('pushMessages') === 'on',
            pushWishlist: formData.get('pushWishlist') === 'on'
        };

        this.saveUserData();
        this.showToast('Notification preferences saved!', 'success');
    }

    saveUserData() {
        localStorage.setItem(`userData_${this.currentUser.email}`, JSON.stringify(this.userData));
    }

    loadOrderHistory() {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;

        // Load orders from localStorage or use sample data
        const ordersStr = localStorage.getItem(`orders_${this.currentUser.email}`);
        if (ordersStr) {
            try {
                this.orders = JSON.parse(ordersStr);
            } catch (error) {
                console.error('Error parsing orders:', error);
                this.orders = [];
            }
        }

        if (this.orders.length === 0) {
            // Show empty state
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>Start shopping to see your order history here</p>
                    <a href="/books.html" class="btn btn-primary">Browse Books</a>
                </div>
            `;
        } else {
            // Render orders
            ordersContainer.innerHTML = this.orders.map(order => this.renderOrder(order)).join('');
        }
    }

    renderOrder(order) {
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id}</h4>
                        <p class="order-date">${new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div class="order-status ${order.status.toLowerCase()}">
                        ${order.status}
                    </div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="item-details">
                                <h5>${item.title}</h5>
                                <p>by ${item.author}</p>
                                <span class="item-price">$${item.price}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">
                        <strong>Total: $${order.total}</strong>
                    </div>
                    <button class="btn btn-outline btn-small" onclick="profileManager.viewOrder('${order.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    loadAddresses() {
        const addressesGrid = document.getElementById('addressesGrid');
        if (!addressesGrid) return;

        // Load addresses from localStorage
        const addressesStr = localStorage.getItem(`addresses_${this.currentUser.email}`);
        if (addressesStr) {
            try {
                this.addresses = JSON.parse(addressesStr);
            } catch (error) {
                console.error('Error parsing addresses:', error);
                this.addresses = [];
            }
        }

        if (this.addresses.length === 0) {
            addressesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>No Addresses Added</h3>
                    <p>Add your delivery addresses for faster checkout</p>
                </div>
            `;
        } else {
            addressesGrid.innerHTML = this.addresses.map(address => this.renderAddress(address)).join('');
        }
    }

    renderAddress(address) {
        return `
            <div class="address-card">
                <div class="address-header">
                    <h4>${address.label}</h4>
                    ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                <div class="address-content">
                    <p>${address.street}</p>
                    <p>${address.city}, ${address.state} ${address.zipCode}</p>
                    <p>${address.country}</p>
                </div>
                <div class="address-actions">
                    <button class="btn btn-outline btn-small" onclick="profileManager.editAddress('${address.id}')">
                        Edit
                    </button>
                    <button class="btn btn-outline btn-small btn-danger" onclick="profileManager.deleteAddress('${address.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    loadPaymentMethods() {
        const paymentMethodsGrid = document.getElementById('paymentMethodsGrid');
        if (!paymentMethodsGrid) return;

        // Load payment methods from localStorage
        const paymentMethodsStr = localStorage.getItem(`paymentMethods_${this.currentUser.email}`);
        if (paymentMethodsStr) {
            try {
                this.paymentMethods = JSON.parse(paymentMethodsStr);
            } catch (error) {
                console.error('Error parsing payment methods:', error);
                this.paymentMethods = [];
            }
        }

        if (this.paymentMethods.length === 0) {
            paymentMethodsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <h3>No Payment Methods</h3>
                    <p>Add your payment methods for secure transactions</p>
                </div>
            `;
        } else {
            paymentMethodsGrid.innerHTML = this.paymentMethods.map(method => this.renderPaymentMethod(method)).join('');
        }
    }

    renderPaymentMethod(method) {
        return `
            <div class="payment-method-card">
                <div class="payment-method-header">
                    <div class="card-icon">
                        <i class="fab fa-${method.type.toLowerCase()}"></i>
                    </div>
                    <div class="card-info">
                        <h4>${method.type} •••• ${method.last4}</h4>
                        <p>Expires ${method.expiryMonth}/${method.expiryYear}</p>
                    </div>
                </div>
                <div class="payment-method-actions">
                    ${method.isDefault ? '<span class="default-badge">Default</span>' : ''}
                    <button class="btn btn-outline btn-small" onclick="profileManager.editPaymentMethod('${method.id}')">
                        Edit
                    </button>
                    <button class="btn btn-outline btn-small btn-danger" onclick="profileManager.deletePaymentMethod('${method.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    updateProfileStats() {
        // Update profile statistics
        const booksOwned = document.getElementById('booksOwned');
        const booksSold = document.getElementById('booksSold');
        const memberSince = document.getElementById('memberSince');

        if (booksOwned) {
            booksOwned.textContent = this.userData.booksOwned || 0;
        }
        if (booksSold) {
            booksSold.textContent = this.userData.booksSold || 0;
        }
        if (memberSince) {
            memberSince.textContent = '2025';
        }
    }

    showAvatarModal() {
        const avatarModal = document.getElementById('avatarModal');
        if (avatarModal) {
            avatarModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    bindModalEvents() {
        // Avatar Modal
        const avatarModal = document.getElementById('avatarModal');
        const uploadArea = document.getElementById('uploadArea');
        const avatarUpload = document.getElementById('avatarUpload');
        const saveAvatarBtn = document.getElementById('saveAvatarBtn');

        if (uploadArea && avatarUpload) {
            uploadArea.addEventListener('click', () => {
                avatarUpload.click();
            });

            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleAvatarUpload(file);
                }
            });
        }

        if (saveAvatarBtn) {
            saveAvatarBtn.addEventListener('click', () => {
                this.saveAvatar();
            });
        }

        // Close modals
        const modalCloses = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                this.hideModals();
            });
        });

        // Click outside to close
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModals();
                }
            });
        });
    }

    handleAvatarUpload(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('File size must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const profileAvatar = document.getElementById('profileAvatar');
            const userAvatar = document.querySelector('.user-avatar');
            
            if (profileAvatar) profileAvatar.src = e.target.result;
            if (userAvatar) userAvatar.src = e.target.result;
            
            this.userData.avatar = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    saveAvatar() {
        this.saveUserData();
        this.hideModals();
        this.showToast('Profile picture updated successfully!', 'success');
    }

    hideModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            ${type === 'success' ? 'background-color: #28a745;' : ''}
            ${type === 'error' ? 'background-color: #dc3545;' : ''}
            ${type === 'info' ? 'background-color: #17a2b8;' : ''}
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Placeholder methods for future implementation
    viewOrder(orderId) {
        console.log('View order:', orderId);
        this.showToast('Order details feature coming soon!', 'info');
    }

    showAddAddressModal() {
        this.showToast('Add address feature coming soon!', 'info');
    }

    editAddress(addressId) {
        console.log('Edit address:', addressId);
        this.showToast('Edit address feature coming soon!', 'info');
    }

    deleteAddress(addressId) {
        if (confirm('Are you sure you want to delete this address?')) {
            this.addresses = this.addresses.filter(addr => addr.id !== addressId);
            localStorage.setItem(`addresses_${this.currentUser.email}`, JSON.stringify(this.addresses));
            this.loadAddresses();
            this.showToast('Address deleted successfully!', 'success');
        }
    }

    showAddPaymentModal() {
        this.showToast('Add payment method feature coming soon!', 'info');
    }

    editPaymentMethod(methodId) {
        console.log('Edit payment method:', methodId);
        this.showToast('Edit payment method feature coming soon!', 'info');
    }

    deletePaymentMethod(methodId) {
        if (confirm('Are you sure you want to delete this payment method?')) {
            this.paymentMethods = this.paymentMethods.filter(method => method.id !== methodId);
            localStorage.setItem(`paymentMethods_${this.currentUser.email}`, JSON.stringify(this.paymentMethods));
            this.loadPaymentMethods();
            this.showToast('Payment method deleted successfully!', 'success');
        }
    }

    updateDangerZoneButtons() {
        const deactivateBtn = document.getElementById('deactivateBtn');
        const activateBtn = document.getElementById('activateBtn');
        const deactivateModal = document.getElementById('deactivateModal');
        const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
        const activateAccountBtn = document.getElementById('activateAccountBtn');
        
        if (this.currentUser && !this.currentUser.isActive) {
            // Account is deactivated
            if (deactivateBtn) deactivateBtn.style.display = 'none';
            if (activateBtn) activateBtn.style.display = 'block';
            if (deactivateModal) {
                const modalBody = deactivateModal.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <p>Your account is currently deactivated.</p>
                        <p>When deactivated:</p>
                        <ul>
                            <li>You cannot buy or sell books</li>
                            <li>Your profile is hidden from other users</li>
                            <li>You cannot access cart, wishlist, or checkout</li>
                        </ul>
                        <p><strong>Click "Activate Account" to restore full access.</strong></p>
                    `;
                }
                // Show activate button in modal footer
                if (deactivateAccountBtn) deactivateAccountBtn.style.display = 'none';
                if (activateAccountBtn) activateAccountBtn.style.display = 'block';
            }
        } else {
            // Account is active
            if (deactivateBtn) deactivateBtn.style.display = 'block';
            if (activateBtn) activateBtn.style.display = 'none';
            if (deactivateModal) {
                const modalBody = deactivateModal.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <p>Are you sure you want to deactivate your account? This action will:</p>
                        <ul>
                            <li>Hide your profile from other users</li>
                            <li>Disable your ability to buy or sell books</li>
                            <li>Keep your data for 30 days in case you want to reactivate</li>
                        </ul>
                        <p><strong>This action can be undone within 30 days.</strong></p>
                    `;
                }
                // Show deactivate button in modal footer
                if (deactivateAccountBtn) deactivateAccountBtn.style.display = 'block';
                if (activateAccountBtn) activateAccountBtn.style.display = 'none';
            }
        }
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
}); 