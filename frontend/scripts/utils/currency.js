// currency.js - Currency utilities for INR (Indian Rupees)

/**
 * Format amount in Indian Rupees
 * @param {number} amount - Amount in INR
 * @returns {string} Formatted amount with ₹ symbol
 */
export function formatInr(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '₹0.00';
    }
    return `₹${amount.toFixed(2)}`;
}

/**
 * Format price range (for original price and current price)
 * @param {number} currentPrice - Current price in INR
 * @param {number} originalPrice - Original price in INR (optional)
 * @returns {string} Formatted price string
 */
export function formatPriceRange(currentPrice, originalPrice = null) {
    const currentFormatted = formatInr(currentPrice);
    
    if (originalPrice && originalPrice > currentPrice) {
        const originalFormatted = formatInr(originalPrice);
        const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        
        return `
            <span class="current-price">${currentFormatted}</span>
            <span class="original-price">${originalFormatted}</span>
            <span class="discount-badge">-${discountPercent}%</span>
        `;
    }
    
    return currentFormatted;
}

/**
 * Legacy function for backward compatibility - now just formats INR directly
 * @param {number} amount - Amount in INR
 * @returns {string} Formatted amount in INR
 */
export function formatUsdToInr(amount) {
    return formatInr(amount);
} 