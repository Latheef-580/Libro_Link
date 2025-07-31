// auth.js - Authentication functionality for LibroLink

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkAuthStatus();
        
        // Initialize auth forms if they exist
        this.initLoginForm();
        this.initRegisterForm();
        // this.initPasswordToggles(); // Commented out as per edit hint
        this.initUserMenu();
        
        // Handle logout
        this.initLogout();
    }

    checkAuthStatus() {
        // In a real app, this would check with the server
        // For now, we'll use a simple flag stored in memory
        const userData = this.getStoredUser();
        if (userData) {
            this.currentUser = userData;
            this.isLoggedIn = true;
            this.updateUIForLoggedInUser();
        }
    }

    getStoredUser() {
        try {
            // Read user from localStorage
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            return null;
        }
    }

    initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    initRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
            
            // Password strength checker
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('input', this.checkPasswordStrength.bind(this));
            }
            
            // Confirm password validation
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', this.validatePasswordConfirmation.bind(this));
            }
        }
    }

    // initPasswordToggles() {
    //     const passwordToggles = document.querySelectorAll('.password-toggle');
    //     passwordToggles.forEach(toggle => {
    //         toggle.addEventListener('click', (e) => {
    //             e.preventDefault();
    //             const input = toggle.previousElementSibling;
    //             const icon = toggle.querySelector('i');
    //             
    //             if (input.type === 'password') {
    //                 input.type = 'text';
    //                 icon.classList.remove('fa-eye');
    //                 icon.classList.add('fa-eye-slash');
    //             } else {
    //                 input.type = 'password';
    //                 icon.classList.remove('fa-eye-slash');
    //                 icon.classList.add('fa-eye');
    //             }
    //         });
    //     });
    // }

    initUserMenu() {
        const dropdown = document.querySelector('.nav-user-menu .dropdown-toggle');
        const dropdownMenu = document.querySelector('.nav-user-menu .dropdown-menu');
        
        if (dropdown && dropdownMenu) {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                dropdownMenu.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }
    }

    initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        
        // Show loading state
        this.setLoadingState(loginBtn, btnText, btnLoader, true);
        
        try {
            // Simulate API call
            await this.simulateAPICall(1500);
            
            const email = formData.get('email');
            const password = formData.get('password');
            const rememberMe = formData.get('rememberMe');
            
            // Validate form
            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            
            // In a real app, this would make an API call to authenticate
            const loginResult = await this.authenticateUser(email, password);
            
            if (loginResult.success) {
                this.currentUser = loginResult.user;
                this.isLoggedIn = true;
                // Store user data and token in localStorage
                localStorage.setItem('currentUser', JSON.stringify(loginResult.user));
                localStorage.setItem('token', loginResult.token);
                
                // Set flag to trigger welcome animation on index page
                localStorage.setItem('justLoggedIn', 'true');
                console.log('Login successful! Set justLoggedIn flag to true');
                
                // Store user data (in a real app, this would be a secure token)
                if (rememberMe) {
                    // Store for longer period
                }
                
                // Update UI for user role
                if (window.libroLink) {
                    window.libroLink.updateUIForUserRole();
                }
                
                // Check account status and show appropriate message
                if (loginResult.accountStatus && !loginResult.accountStatus.isActive) {
                    this.showMessage('Login successful! Your account is deactivated. You can reactivate it from your profile page.', 'warning');
                } else {
                    this.showSuccessMessage('Login successful! Redirecting...');
                }
                
                // Redirect after short delay
                setTimeout(() => {
                    fadeOutAndRedirect('/');
                }, 1000);
            } else {
                throw new Error(loginResult.message || 'Login failed');
            }
            
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.setLoadingState(loginBtn, btnText, btnLoader, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoader = registerBtn.querySelector('.btn-loader');
        
        // Show loading state
        this.setLoadingState(registerBtn, btnText, btnLoader, true);
        
        try {
            // Validate form
            const validationResult = this.validateRegistrationForm(formData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            // Convert FormData to a plain object
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // In a real app, this would make an API call to register
            const registerResult = await this.registerUser(data);
            
            if (registerResult.success) {
                this.currentUser = registerResult.user; // Assuming registerResult.user contains the full user object
                this.isLoggedIn = true;
                this.showSuccessMessage('Registration successful! Please check your email to verify your account.');
                
                // Redirect to login page after short delay
                setTimeout(() => {
                    fadeOutAndRedirect('/login');
                }, 2000);
            } else {
                throw new Error(registerResult.message || 'Registration failed');
            }
            
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.setLoadingState(registerBtn, btnText, btnLoader, false);
        }
    }

    handleLogout(e) {
        e.preventDefault();
        
        // Clear user-specific data before clearing user info
        this.clearUserSpecificData();
        
        // Clear user data
        this.currentUser = null;
        this.isLoggedIn = false;
        // Remove user and token from localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        
        // In a real app, this would invalidate the session/token
        this.clearStoredUser();
        
        this.showSuccessMessage('Logged out successfully');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    validateRegistrationForm(formData) {
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const accountType = formData.get('accountType');
        const agreeTerms = formData.get('agreeTerms');
        
        if (!firstName || firstName.length < 2) {
            return { isValid: false, message: 'First name must be at least 2 characters' };
        }
        
        if (!lastName || lastName.length < 2) {
            return { isValid: false, message: 'Last name must be at least 2 characters' };
        }
        
        if (!this.validateEmail(email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        if (!username || username.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters' };
        }
        
        if (!password || password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters' };
        }
        
        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }
        
        if (!accountType) {
            return { isValid: false, message: 'Please select an account type' };
        }
        
        if (!agreeTerms) {
            return { isValid: false, message: 'You must agree to the Terms of Service and Privacy Policy' };
        }
        
        return { isValid: true };
    }

    checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthIndicator = document.getElementById('passwordStrength');
        
        if (!strengthIndicator) return;
        
        const strengthBar = strengthIndicator.querySelector('.strength-fill');
        const strengthText = strengthIndicator.querySelector('.strength-text');
        
        let strength = 0;
        let strengthLabel = 'Very Weak';
        let strengthColor = '#ff4757';
        
        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Determine strength level
        switch (strength) {
            case 0:
            case 1:
                strengthLabel = 'Very Weak';
                strengthColor = '#ff4757';
                break;
            case 2:
            case 3:
                strengthLabel = 'Weak';
                strengthColor = '#ff7675';
                break;
            case 4:
                strengthLabel = 'Fair';
                strengthColor = '#fdcb6e';
                break;
            case 5:
                strengthLabel = 'Good';
                strengthColor = '#6c5ce7';
                break;
            case 6:
                strengthLabel = 'Strong';
                strengthColor = '#00b894';
                break;
        }
        
        // Update UI
        const strengthPercentage = (strength / 6) * 100;
        strengthBar.style.width = `${strengthPercentage}%`;
        strengthBar.style.backgroundColor = strengthColor;
        strengthText.textContent = strengthLabel;
    }

    validatePasswordConfirmation(e) {
        const confirmPassword = e.target.value;
        const password = document.getElementById('password').value;
        const input = e.target;
        
        if (confirmPassword && password !== confirmPassword) {
            input.setCustomValidity('Passwords do not match');
            input.classList.add('error');
        } else {
            input.setCustomValidity('');
            input.classList.remove('error');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async authenticateUser(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                // Store account status information
                if (data.accountStatus) {
                    localStorage.setItem('accountStatus', JSON.stringify(data.accountStatus));
                } else {
                    // Default to active if no account status provided
                    localStorage.setItem('accountStatus', JSON.stringify({
                        isActive: true,
                        accountStatus: 'active',
                        deactivatedAt: null
                    }));
                }
                return { 
                    success: true, 
                    user: data.user, 
                    token: data.token,
                    accountStatus: data.accountStatus 
                };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    async registerUser(data) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                return { success: true, user: result.user, message: result.message };
            } else {
                return { success: false, message: result.message || 'Registration failed' };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    updateUIForLoggedInUser() {
        const navUser = document.getElementById('navUser');
        const navUserMenu = document.getElementById('navUserMenu');
        const userDisplayName = document.getElementById('userDisplayName');
        
        if (navUser && navUserMenu) {
            navUser.style.display = 'none';
            navUserMenu.style.display = 'block';
        }
        
        if (userDisplayName && this.currentUser) {
            userDisplayName.textContent = this.currentUser.firstName || this.currentUser.username;
            
            // Check account status and add visual indicator if deactivated
            const accountStatus = JSON.parse(localStorage.getItem('accountStatus') || '{}');
            if (accountStatus && !accountStatus.isActive) {
                // Add a small warning indicator
                const warningIndicator = document.createElement('span');
                warningIndicator.innerHTML = ' <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 12px;" title="Account Deactivated"></i>';
                userDisplayName.appendChild(warningIndicator);
            }
        }
        
        // Update profile information if on profile page
        this.updateProfileInfo();
        
        // Update cart and wishlist counts for logged in user
        this.updateCartAndWishlistCounts();
    }
    
    updateCartAndWishlistCounts() {
        if (!this.currentUser) return;
        
        // Get user-specific cart and wishlist data
        const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email;
        const cartData = localStorage.getItem(`cart_${userId}`);
        const wishlistData = localStorage.getItem(`wishlist_${userId}`);
        
        let cartItems = [];
        let wishlistItems = [];
        
        try {
            if (cartData) {
                cartItems = JSON.parse(cartData);
            }
            if (wishlistData) {
                wishlistItems = JSON.parse(wishlistData);
            }
        } catch (error) {
            console.error('Error parsing cart/wishlist data:', error);
        }
        
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = cartItems.length;
            cartCount.style.display = cartItems.length > 0 ? 'inline' : 'none';
        }
        
        // Update wishlist count
        const wishlistCount = document.querySelector('.wishlist-count');
        if (wishlistCount) {
            wishlistCount.textContent = wishlistItems.length;
            wishlistCount.style.display = wishlistItems.length > 0 ? 'inline' : 'none';
        }
        
        // Also update the main LibroLink instance if it exists
        if (window.libroLink) {
            window.libroLink.cart = cartItems;
            window.libroLink.wishlist = wishlistItems;
            window.libroLink.updateCartCount();
            window.libroLink.updateWishlistCount();
        }
    }

    updateProfileInfo() {
        if (!this.currentUser) return;
        
        const profileName = document.getElementById('profileName');
        const profileUsername = document.getElementById('profileUsername');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');
        
        if (profileName) {
            profileName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        if (profileUsername) {
            profileUsername.textContent = `@${this.currentUser.username}`;
        }
        
        if (firstNameInput) {
            firstNameInput.value = this.currentUser.firstName;
        }
        
        if (lastNameInput) {
            lastNameInput.value = this.currentUser.lastName;
        }
        
        if (emailInput) {
            emailInput.value = this.currentUser.email;
        }
        
        if (usernameInput) {
            usernameInput.value = this.currentUser.username;
        }
    }

    setLoadingState(button, textElement, loaderElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.style.display = 'none';
            loaderElement.style.display = 'inline-block';
        } else {
            button.disabled = false;
            textElement.style.display = 'inline-block';
            loaderElement.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Insert message
        const form = document.querySelector('.auth-form') || document.querySelector('form');
        if (form) {
            form.insertBefore(messageEl, form.firstChild);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }

    clearStoredUser() {
        // In a real app, this would clear secure tokens/sessions
        // For demo purposes, we're just clearing the in-memory data
        // Note: Cart and wishlist data are preserved for user convenience
    }

    clearUserSpecificData() {
        // Reset cart and wishlist counts in the UI when user logs out
        const cartCount = document.querySelector('.cart-count');
        const wishlistCount = document.querySelector('.wishlist-count');
        
        if (cartCount) {
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
        }
        
        if (wishlistCount) {
            wishlistCount.textContent = '0';
            wishlistCount.style.display = 'none';
        }
        
        // Also reset the cart and wishlist arrays in the main LibroLink instance if it exists
        if (window.libroLink) {
            window.libroLink.cart = [];
            window.libroLink.wishlist = [];
            window.libroLink.updateCartCount();
            window.libroLink.updateWishlistCount();
        }
        
        console.log('clearUserSpecificData: Cart and wishlist counts reset for logged out user');
    }

    simulateAPICall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Public methods for other scripts to use
    getCurrentUser() {
        return this.currentUser;
    }

    isUserLoggedIn() {
        return this.isLoggedIn;
    }

    requireAuth(redirectTo = '/login') {
        if (!this.isLoggedIn) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
}

// Restore fadeOutAndRedirect to only fade out the body and redirect
function fadeOutAndRedirect(url) {
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = url;
  }, 600);
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Google Sign-In simulation
document.addEventListener('DOMContentLoaded', () => {
    const googleBtns = document.querySelectorAll('.btn-google');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Google Sign-In would be implemented here with the Google OAuth API');
        });
    });
});

// Profile tab functionality
document.addEventListener('DOMContentLoaded', () => {
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    profileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetTab = item.getAttribute('data-tab');
            
            // Remove active class from all menu items and tab contents
            profileMenuItems.forEach(mi => mi.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked item and corresponding tab
            item.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Avatar upload simulation
    const avatarEditBtn = document.getElementById('avatarEditBtn');
    const avatarModal = document.getElementById('avatarModal');
    const avatarUpload = document.getElementById('avatarUpload');
    const uploadArea = document.getElementById('uploadArea');
    
    if (avatarEditBtn && avatarModal) {
        avatarEditBtn.addEventListener('click', () => {
            avatarModal.classList.add('show');
        });
    }
    
    if (uploadArea && avatarUpload) {
        uploadArea.addEventListener('click', () => {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadArea.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;">
                        <p>Click to change image</p>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Modal close functionality
    const modalCloses = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            const modal = close.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Close modal on outside click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});