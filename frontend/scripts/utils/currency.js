// currency.js - Currency conversion utilities

// Exchange rate: 1 USD = 83.5 INR (approximate current rate)
const USD_TO_INR_RATE = 83.5;

/**
 * Convert USD to INR (Rupees)
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Amount in INR
 */
export function usdToInr(usdAmount) {
    if (typeof usdAmount !== 'number' || isNaN(usdAmount)) {
        return 0;
    }
    return usdAmount * USD_TO_INR_RATE;
}

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
 * Convert USD to INR and format as currency string
 * @param {number} usdAmount - Amount in USD
 * @returns {string} Formatted amount in INR
 */
export function formatUsdToInr(usdAmount) {
    const inrAmount = usdToInr(usdAmount);
    return formatInr(inrAmount);
}

/**
 * Format price range (for original price and current price)
 * @param {number} currentPrice - Current price in USD
 * @param {number} originalPrice - Original price in USD (optional)
 * @returns {string} Formatted price string
 */
export function formatPriceRange(currentPrice, originalPrice = null) {
    const currentInr = usdToInr(currentPrice);
    const currentFormatted = formatInr(currentInr);
    
    if (originalPrice && originalPrice > currentPrice) {
        const originalInr = usdToInr(originalPrice);
        const originalFormatted = formatInr(originalInr);
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
 * Get the current exchange rate
 * @returns {number} Current USD to INR exchange rate
 */
export function getExchangeRate() {
    return USD_TO_INR_RATE;
}

/**
 * Update exchange rate (for future API integration)
 * @param {number} newRate - New exchange rate
 */
export function updateExchangeRate(newRate) {
    if (typeof newRate === 'number' && newRate > 0) {
        USD_TO_INR_RATE = newRate;
    }
} 