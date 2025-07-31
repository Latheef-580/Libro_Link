// cart.js - Handles cart page, cart sidebar, and cart logic for LibroLink
import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';

function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
}

class CartManager {
    constructor() {
        this.cartItems = [];
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.checkAuthStatus();
        this.loadCart();
        this.bindEvents();
        this.renderCartPage();
    }

    bindEvents() {
        // Bind checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Bind clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        // Setup cart sidebar
        this.setupCartSidebar();
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
            alert('You need a buyer account to access the cart. Please contact support to upgrade your account.');
            window.location.href = '/';
            return;
        }
    }

    getUserSpecificKey(key) {
        if (!this.currentUser) return key;
        const userKey = `${key}_${this.currentUser.id || this.currentUser._id || this.currentUser.email}`;
        console.log('Cart: getUserSpecificKey:', key, '->', userKey, 'for user:', this.currentUser);
        return userKey;
    }

    async loadCart() {
        const userKey = this.getUserSpecificKey('cart');
        console.log('Cart: Loading cart with key:', userKey);
        this.cartItems = JSON.parse(localStorage.getItem(userKey) || '[]');
        console.log('Cart: Cart items loaded:', this.cartItems);
    }

    async saveCart() {
        const userKey = this.getUserSpecificKey('cart');
        localStorage.setItem(userKey, JSON.stringify(this.cartItems));
        console.log('Cart saved:', this.cartItems);
        await this.loadCart();
    }

    renderCartCount() {
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(count => {
            count.textContent = this.cartItems.length;
        });
    }

    setupCartSidebar() {
        const cartLink = document.getElementById('cartLink');
        const cartSidebar = document.getElementById('cartSidebar');
        const closeBtn = document.getElementById('closeCartSidebar');
        if (cartLink && cartSidebar) {
            cartLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.renderCartSidebar();
                cartSidebar.style.display = 'flex';
                setTimeout(() => cartSidebar.classList.add('open'), 10);
            });
        }
        if (closeBtn && cartSidebar) {
            closeBtn.addEventListener('click', () => {
                cartSidebar.classList.remove('open');
                setTimeout(() => cartSidebar.style.display = 'none', 300);
            });
        }
        // Close sidebar on outside click
        if (cartSidebar) {
            cartSidebar.addEventListener('click', (e) => {
                if (e.target === cartSidebar) {
                    cartSidebar.classList.remove('open');
                    setTimeout(() => cartSidebar.style.display = 'none', 300);
                }
            });
        }
    }

    renderCartSidebar() {
        const sidebarContent = document.getElementById('cartSidebarContent');
        const sidebarTotal = document.getElementById('cartSidebarTotal');
        if (!sidebarContent || !sidebarTotal) return;
        this.loadCart();
        if (this.cartItems.length === 0) {
            sidebarContent.innerHTML = '<div style="text-align:center; color:#888; padding:40px 0;">Your cart is empty</div>';
            sidebarTotal.textContent = formatInr(0);
            return;
        }
        let total = 0;
        sidebarContent.innerHTML = this.cartItems.map(item => {
            total += item.price * (item.quantity || 1);
            return `
                <div class="cart-sidebar-item" style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
                    <img src="${item.image || '/assets/images/placeholder-book.jpg'}" alt="${item.title}" style="width:48px;height:64px;object-fit:cover;border-radius:8px;">
                    <div style="flex:1;">
                        <div style="font-weight:600;">${item.title}</div>
                        <div style="font-size:0.95rem;color:#888;">by ${item.author}</div>
                        <div style="font-size:0.98rem;color:#333;">${formatInr(item.price)} x ${item.quantity || 1}</div>
                    </div>
                    <button class="btn btn-outline btn-small" data-remove-cart="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');
        sidebarTotal.textContent = formatInr(total);
        // Remove item event
        sidebarContent.querySelectorAll('[data-remove-cart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-remove-cart'));
                this.removeFromCart(id);
                this.renderCartSidebar();
                this.renderCartPage();
            });
        });
    }

    renderCartPage() {
        const cartContent = document.getElementById('cartContent');
        const cartSummary = document.getElementById('cartSummary');
        if (!cartContent || !cartSummary) return;
        this.loadCart();
        if (this.cartItems.length === 0) {
            cartContent.innerHTML = `<div class="empty-state" style="padding:80px 0;text-align:center;color:#888;">
                <i class="fas fa-shopping-cart" style="font-size:64px;color:#e9ecef;"></i>
                <h3 style="color:#333;margin:18px 0 8px 0;">Your cart is empty</h3>
                <p style="margin-bottom:24px;">Add some books to your cart to see them here.</p>
                <a href="/books" class="btn btn-primary btn-large"><i class="fas fa-search"></i> Browse Books</a>
            </div>`;
            cartSummary.innerHTML = '';
            return;
        }
        let total = 0;
        cartContent.innerHTML = this.cartItems.map(item => {
            total += item.price * (item.quantity || 1);
            return `
                <div class="cart-card" data-book-id="${item.id}">
                    <div class="cart-content-container">
                        <img src="${item.image || '/assets/images/placeholder-book.jpg'}" alt="${item.title}" class="cart-book-image">
                        <div>
                            <div class="cart-book-name">${item.title}</div>
                            <div class="cart-book-author">by ${item.author}</div>
                            <div class="cart-book-price">${formatInr(item.price)}</div>
                        </div>
                    </div>
                    <div class="cart-rating">
                        <div class="cart-quantity-controls">
                            <button data-qty-down="${item.id}">-</button>
                            <input type="number" min="1" value="${item.quantity || 1}" data-qty-input="${item.id}">
                            <button data-qty-up="${item.id}">+</button>
                        </div>
                        <button class="cart-remove-btn" data-remove-cart="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        cartSummary.innerHTML = `
            <div class="summary-card" style="background:white;border-radius:16px;box-shadow:0 8px 32px rgba(102,126,234,0.08);padding:32px 24px;max-width:400px;margin:0 auto;">
                <h3 style="color:#667eea;font-size:1.3rem;margin-bottom:18px;">Cart Summary</h3>
                <div class="summary-stats" style="margin-bottom:18px;">
                    <div class="stat-row" style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>Total Items:</span>
                        <span>${this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span>
                    </div>
                    <div class="stat-row total" style="display:flex;justify-content:space-between;font-weight:600;color:#222;">
                        <span>Total Price:</span>
                        <span>${formatInr(total)}</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-full" id="checkoutBtn"><i class="fas fa-credit-card"></i> Checkout</button>
            </div>
        `;
        // Quantity and remove events
        cartContent.querySelectorAll('.cart-quantity-controls button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-qty-down')) || parseInt(btn.getAttribute('data-qty-up'));
                const delta = btn.hasAttribute('data-qty-down') ? -1 : 1;
                this.updateQuantity(id, delta);
                this.renderCartPage();
                this.renderCartSidebar();
            });
        });
        cartContent.querySelectorAll('.cart-quantity-controls input').forEach(input => {
            input.addEventListener('change', () => {
                const id = parseInt(input.getAttribute('data-qty-input'));
                const val = Math.max(1, parseInt(input.value) || 1);
                this.setQuantity(id, val);
                this.renderCartPage();
                this.renderCartSidebar();
            });
        });
        cartContent.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-remove-cart'));
                this.removeFromCart(id);
                this.renderCartPage();
                this.renderCartSidebar();
            });
        });
        // Add click event listeners to cart cards for navigation to book details
        cartContent.querySelectorAll('.cart-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.cart-quantity-controls') || e.target.closest('.cart-remove-btn')) {
                    return;
                }
                const bookId = card.getAttribute('data-book-id');
                if (bookId) {
                    window.location.href = `/book-details.html?id=${bookId}`;
                }
            });
        });
        // Clear cart
        const clearBtn = document.getElementById('clearCartBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (confirm('Are you sure you want to clear your cart?')) {
                    this.cartItems = [];
                    this.saveCart();
                    this.renderCartPage();
                    this.renderCartSidebar();
                    if (window.showNotification) window.showNotification('Cart cleared', 'success');
                    this.renderCartCount();
                }
            };
        }
        // Checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                this.proceedToCheckout();
            };
        }
    }

    async updateQuantity(id, delta) {
        const item = this.cartItems.find(i => String(i.id) === String(id));
        if (item) {
            item.quantity = Math.max(1, (item.quantity || 1) + delta);
            await this.saveCart();
        }
    }

    async setQuantity(id, qty) {
        const item = this.cartItems.find(i => String(i.id) === String(id));
        if (item) {
            item.quantity = Math.max(1, qty);
            await this.saveCart();
        }
    }

    async removeFromCart(id) {
        this.cartItems = this.cartItems.filter(i => String(i.id) !== String(id));
        await this.saveCart();
    }

    async addToCart(book) {
        const userKey = this.getUserSpecificKey('cart');
        this.cartItems = JSON.parse(localStorage.getItem(userKey) || '[]');
        const existing = this.cartItems.find(item => String(item.id) === String(book.id));
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            this.cartItems.push({ ...book, quantity: 1 });
        }
        await this.saveCart();
    }

    async proceedToCheckout() {
        if (this.cartItems.length === 0) {
            this.showNotification('Your cart is empty', 'info');
            return;
        }
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
    }

    clearCart() {
        if (this.cartItems.length === 0) {
            this.showNotification('Your cart is already empty', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cartItems = [];
            this.saveCart();
            this.renderCartPage();
            this.showNotification('Cart cleared successfully', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
}); 