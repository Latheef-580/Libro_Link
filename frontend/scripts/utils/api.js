// API utility functions for LibroLink

// Base API URL
const API_BASE_URL = '/api';

// Generic fetch function with authentication
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Check for account deactivation
        if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.error === 'Account deactivated') {
                showAccountDeactivatedMessage();
                return { error: 'Account deactivated' };
            }
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check account status
export async function checkAccountStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return { isActive: false };
        
        const response = await fetch(`${API_BASE_URL}/users/account-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.error === 'Account deactivated') {
                return { isActive: false, accountStatus: 'deactivated' };
            }
        }
        
        return { isActive: true };
    } catch (error) {
        console.error('Error checking account status:', error);
        return { isActive: true }; // Assume active if check fails
    }
}

// Show account deactivated message
export function showAccountDeactivatedMessage(action = 'this action') {
    // Create modal for account deactivated message
    const modal = document.createElement('div');
    modal.className = 'modal account-deactivated-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        ">
            <div style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">
                <i class="fas fa-user-slash"></i>
            </div>
            <h3 style="color: #333; margin-bottom: 16px;">Account Deactivated</h3>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.5;">
                Your account has been deactivated. You cannot ${action} at this time.
            </p>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.5; font-size: 14px;">
                You can still browse books and access your profile to reactivate your account.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="closeModalBtn" style="
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
                <button id="goToProfileBtn" style="
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                ">Go to Profile</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for buttons
    const closeBtn = modal.querySelector('#closeModalBtn');
    const goToProfileBtn = modal.querySelector('#goToProfileBtn');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    goToProfileBtn.addEventListener('click', () => {
        modal.remove();
        window.location.href = '/profile.html#account-settings';
    });
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 8000);
}

// Prevent action for deactivated accounts
export async function preventDeactivatedAction(action) {
    // Only check account status for shopping-related actions
    const shoppingActions = ['add to cart', 'add to wishlist', 'checkout', 'purchase', 'buy'];
    
    if (!shoppingActions.includes(action)) {
        return true; // Allow non-shopping actions
    }
    
    // Get account status from localStorage instead of making API calls
    const accountStatus = JSON.parse(localStorage.getItem('accountStatus') || '{"isActive": true}');
    
    if (!accountStatus.isActive) {
        showAccountDeactivatedMessage(action);
        return false;
    }
    
    return true;
}

// Enhanced add to cart with account check
export async function addToCartWithCheck(bookId) {
    const canProceed = await preventDeactivatedAction('add to cart');
    if (!canProceed) return false;
    
    // Proceed with add to cart logic
    return true;
}

// Enhanced add to wishlist with account check
export async function addToWishlistWithCheck(bookId) {
    const canProceed = await preventDeactivatedAction('add to wishlist');
    if (!canProceed) return false;
    
    // Proceed with add to wishlist logic
    return true;
}

// Enhanced checkout with account check
export async function checkoutWithCheck() {
    const canProceed = await preventDeactivatedAction('checkout');
    if (!canProceed) return false;
    
    // Proceed with checkout logic
    return true;
} 