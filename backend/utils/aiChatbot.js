// backend/utils/aiChatbot.js
const Book = require('../models/Book');

class AIChatbot {
    constructor() {
        this.conversationHistory = new Map();
        this.enabled = true;
    }

    async processMessage(userId, message, context = {}) {
        try {
            const lowerMessage = message.toLowerCase().trim();

            // Handle recommendation requests
            if (this.isRecommendationRequest(lowerMessage)) {
                return await this.handleRecommendationRequest(userId, message, context);
            }

            // Handle support requests
            if (this.isSupportRequest(lowerMessage)) {
                return await this.handleSupportRequest(message, context);
            }

            // Handle general queries
            if (this.isGeneralQuery(lowerMessage)) {
                return await this.handleGeneralQuery(message, context);
            }

            // Default response
            return {
                type: 'ai_response',
                message: "I'm here to help you find books and answer questions about LibroLink. You can ask me for book recommendations, help with your account, or general questions about our platform.",
                timestamp: new Date(),
                context: context
            };

        } catch (error) {
            console.error('Chatbot error:', error);
            return {
                type: 'error',
                message: "I'm having trouble processing your request right now. Please try again or contact our support team.",
                timestamp: new Date(),
                context: context
            };
        }
    }

    async handleRecommendationRequest(userId, message, context) {
        try {
            const preferences = this.extractPreferencesFromMessage(message);
            
            // Build query based on preferences
            let query = { status: 'available' };
            
            if (preferences.category) {
                query.category = { $regex: preferences.category, $options: 'i' };
            }
            
            if (preferences.genre) {
                query.genre = { $regex: preferences.genre, $options: 'i' };
            }
            
            if (preferences.author) {
                query.author = { $regex: preferences.author, $options: 'i' };
            }
            
            if (preferences.maxPrice) {
                query.price = { $lte: preferences.maxPrice };
            }

            // Get recommendations
            let recommendations = await Book.find(query)
                .sort({ 'analytics.viewCount': -1, 'analytics.rating': -1 })
                .limit(5);

            // If no specific preferences, get popular books
            if (recommendations.length === 0 && !preferences.category && !preferences.genre && !preferences.author) {
                recommendations = await Book.find({ status: 'available' })
                    .sort({ 'analytics.viewCount': -1 })
                    .limit(5);
            }

            // Generate response
            const response = this.formatRecommendationResponse(recommendations, preferences);
            
            return {
                type: 'recommendation',
                message: response,
                recommendations: recommendations,
                timestamp: new Date(),
                context: context
            };

        } catch (error) {
            console.error('Recommendation error:', error);
            return {
                type: 'error',
                message: "I'm having trouble finding recommendations right now. Please try again later.",
                timestamp: new Date(),
                context: context
            };
        }
    }

    async handleSupportRequest(message, context) {
        try {
            const lowerMessage = message.toLowerCase();
            let response = "";

            if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
                response = "For account issues, you can:\n• Update your profile settings in your account dashboard\n• Reset your password using the 'Forgot Password' link\n• Contact our support team for account recovery\n• Check your order history and wishlist in your profile";
            } else if (lowerMessage.includes('order') || lowerMessage.includes('purchase')) {
                response = "For order-related queries:\n• Check your order status in your profile dashboard\n• View order history and tracking information\n• Contact support for order modifications\n• Check shipping and delivery updates";
            } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
                response = "Payment information:\n• We accept various payment methods including cards and digital wallets\n• Secure payment processing with encryption\n• Payment confirmation sent via email\n• For payment issues, contact our support team";
            } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
                response = "Shipping information:\n• Standard delivery: 3-5 business days\n• Express delivery: 1-2 business days\n• Free shipping on orders above ₹500\n• Track your order in your profile dashboard";
            } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
                response = "Returns and refunds:\n• 7-day return policy for most items\n• Contact support with order details for returns\n• Refunds processed within 3-5 business days\n• Return shipping may apply";
            } else {
                response = "I'm here to help! Please specify what you need assistance with:\n• Account and profile management\n• Orders and purchases\n• Payment and billing\n• Shipping and delivery\n• Returns and refunds";
            }

            return {
                type: 'support',
                message: response,
                timestamp: new Date(),
                context: context
            };

        } catch (error) {
            console.error('Support request error:', error);
            return {
                type: 'error',
                message: "I'm having trouble processing your request. Please contact our support team directly.",
                timestamp: new Date(),
                context: context
            };
        }
    }

    async handleGeneralQuery(message, context) {
        try {
            const lowerMessage = message.toLowerCase();
            let response = "";

            if (lowerMessage.includes('best seller') || lowerMessage.includes('popular')) {
                const popularBooks = await Book.find({ status: 'available' })
                    .sort({ 'analytics.viewCount': -1 })
                    .limit(3);
                
                if (popularBooks.length > 0) {
                    response = "Here are some of our most popular books:\n\n";
                    popularBooks.forEach((book, index) => {
                        response += `${index + 1}. **${book.title}** by ${book.author}\n`;
                        response += `   Category: ${book.category} | Price: ₹${book.price}\n\n`;
                    });
                    response += "You can browse more books in our catalog!";
                } else {
                    response = "We have many great books in our catalog. Try browsing by category or use our search feature to find what you're looking for!";
                }
            } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
                response = "Our book prices vary based on condition, rarity, and demand:\n• Used books: ₹50 - ₹500\n• New books: ₹200 - ₹2000\n• Rare/Collector editions: ₹500+\n• Textbooks: ₹100 - ₹1500\n\nYou can filter by price range when browsing books!";
            } else if (lowerMessage.includes('category') || lowerMessage.includes('genre')) {
                response = "We offer books in various categories:\n• Fiction (Mystery, Romance, Sci-Fi, Fantasy)\n• Non-Fiction (Biography, History, Science)\n• Textbooks (Academic, Professional)\n• Children's Books\n• Self-Help & Business\n\nBrowse our catalog to explore all categories!";
            } else {
                response = "I can help you with:\n• Book recommendations based on your interests\n• Account and order support\n• Information about our platform\n• Finding specific books or authors\n\nWhat would you like to know more about?";
            }

            return {
                type: 'general',
                message: response,
                timestamp: new Date(),
                context: context
            };

        } catch (error) {
            console.error('General query error:', error);
            return {
                type: 'error',
                message: "I'm having trouble processing your request. Please try rephrasing your question.",
                timestamp: new Date(),
                context: context
            };
        }
    }

    isRecommendationRequest(message) {
        const keywords = [
            'recommend', 'suggestion', 'find', 'looking for', 'want to read',
            'similar to', 'like', 'enjoy', 'favorite', 'genre', 'author',
            'fiction', 'mystery', 'romance', 'science', 'history'
        ];
        return keywords.some(keyword => message.includes(keyword));
    }

    isSupportRequest(message) {
        const keywords = [
            'help', 'support', 'issue', 'problem', 'order', 'account',
            'payment', 'shipping', 'return', 'refund', 'track'
        ];
        return keywords.some(keyword => message.includes(keyword));
    }

    isGeneralQuery(message) {
        const keywords = [
            'best seller', 'popular', 'price', 'cost', 'category', 'genre',
            'what', 'how', 'when', 'where', 'why'
        ];
        return keywords.some(keyword => message.includes(keyword));
    }

    extractPreferencesFromMessage(message) {
        const preferences = {};
        const lowerMessage = message.toLowerCase();

        // Extract category/genre
        const categories = ['fiction', 'non-fiction', 'textbooks', 'mystery', 'romance', 'science', 'history', 'biography', 'children'];
        categories.forEach(category => {
            if (lowerMessage.includes(category)) {
                preferences.category = category;
            }
        });

        // Extract author
        const authorMatch = message.match(/(?:by|author|written by)\s+([a-zA-Z\s]+)/i);
        if (authorMatch) {
            preferences.author = authorMatch[1].trim();
        }

        // Extract price range
        const priceMatch = message.match(/(?:under|less than|maximum|up to)\s*₹?(\d+)/i);
        if (priceMatch) {
            preferences.maxPrice = parseInt(priceMatch[1]);
        }

        return preferences;
    }

    formatRecommendationResponse(recommendations, preferences) {
        if (recommendations.length === 0) {
            return "I couldn't find any books matching your preferences. Try broadening your search or check back later for new listings.";
        }

        let response = "Here are some books I think you might enjoy:\n\n";
        
        recommendations.forEach((book, index) => {
            response += `${index + 1}. **${book.title}** by ${book.author}\n`;
            response += `   Category: ${book.category} | Price: ₹${book.price} | Condition: ${book.condition}\n\n`;
        });

        response += "You can click on any book to view more details and purchase options.";
        return response;
    }

    clearConversationHistory(userId) {
        this.conversationHistory.delete(userId);
    }

    getStats() {
        return {
            activeConversations: this.conversationHistory.size,
            totalMessages: Array.from(this.conversationHistory.values())
                .reduce((total, history) => total + history.length, 0)
        };
    }
}

module.exports = new AIChatbot(); 