// backend/routes/ai.js
const express = require('express');
const sampleData = require('../../database/sampleData.json');

const router = express.Router();

// Mock AI responses for when OpenAI API is not available
const mockAIResponses = {
    recommendations: [
        "Based on your reading history, I think you'd enjoy 'The Great Gatsby' - it's a classic with beautiful prose.",
        "If you liked mystery novels, try 'The Girl with the Dragon Tattoo' - it's a gripping thriller.",
        "For science fiction fans, 'Dune' is a must-read epic with complex world-building.",
        "If you're into programming, 'Clean Code' by Robert Martin is highly recommended.",
        "For romance lovers, 'Pride and Prejudice' is a timeless classic.",
        "If you want to learn algorithms, 'Introduction to Algorithms' is the standard reference."
    ],
    chatbot: {
        greeting: "Hello! I'm your LibroLink AI assistant. I can help you find books, answer questions, and provide recommendations. How can I assist you today?",
        bookSuggestions: "Here are some great books I'd recommend: 'The Great Gatsby' for classic literature, 'Dune' for science fiction, and 'Clean Code' for programming.",
        help: "I can help you with book recommendations, finding specific genres, answering questions about books, and more. Just ask me anything!",
        default: "I'm here to help you discover great books! You can ask me for recommendations, search for specific genres, or get help with your account."
    }
};

// AI Recommendation Routes - Modified to work without OpenAI
router.get('/recommendations', async (req, res) => {
    try {
        const { type = 'hybrid', limit = 6 } = req.query;
        
        // Use sample data for recommendations
        let recommendations = sampleData.books.slice(0, parseInt(limit));
        
        // Add mock AI scores
        recommendations = recommendations.map(book => ({
            ...book,
            aiScore: Math.floor(Math.random() * 20 + 80), // Random score between 80-100
            reason: mockAIResponses.recommendations[Math.floor(Math.random() * mockAIResponses.recommendations.length)]
        }));

        res.json({
            success: true,
            recommendations,
            type,
            count: recommendations.length
        });
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recommendations'
        });
    }
});

// Real-time recommendations
router.get('/recommendations/realtime', async (req, res) => {
    try {
        const { bookId, limit = 5 } = req.query;
        
        // Use sample data for real-time recommendations
        let recommendations = sampleData.books.slice(0, parseInt(limit));
        
        // Add mock AI scores
        recommendations = recommendations.map(book => ({
            ...book,
            aiScore: Math.floor(Math.random() * 20 + 80),
            reason: mockAIResponses.recommendations[Math.floor(Math.random() * mockAIResponses.recommendations.length)]
        }));

        res.json({
            success: true,
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        console.error('Real-time recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get real-time recommendations'
        });
    }
});

// AI Chatbot Routes - Modified to work without OpenAI
router.post('/chatbot/message', async (req, res) => {
    try {
        const { message, context = {} } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Simple keyword-based responses
        const lowerMessage = message.toLowerCase();
        let response = {};

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = {
                type: 'text',
                message: mockAIResponses.chatbot.greeting
            };
        } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
            response = {
                type: 'recommendation',
                message: mockAIResponses.chatbot.bookSuggestions,
                recommendations: sampleData.books.slice(0, 3)
            };
        } else if (lowerMessage.includes('help')) {
            response = {
                type: 'text',
                message: mockAIResponses.chatbot.help
            };
        } else if (lowerMessage.includes('fiction') || lowerMessage.includes('novel')) {
            const fictionBooks = sampleData.books.filter(book => 
                book.category === 'fiction' || book.genre === 'Fiction'
            ).slice(0, 3);
            response = {
                type: 'recommendation',
                message: "Here are some great fiction books I'd recommend:",
                recommendations: fictionBooks
            };
        } else if (lowerMessage.includes('mystery') || lowerMessage.includes('thriller')) {
            const mysteryBooks = sampleData.books.filter(book => 
                book.category === 'mystery' || book.genre === 'Mystery'
            ).slice(0, 3);
            response = {
                type: 'recommendation',
                message: "Here are some exciting mystery and thriller books:",
                recommendations: mysteryBooks
            };
        } else if (lowerMessage.includes('sci-fi') || lowerMessage.includes('science fiction')) {
            const scifiBooks = sampleData.books.filter(book => 
                book.category === 'sci-fi' || book.genre === 'Science Fiction'
            ).slice(0, 3);
            response = {
                type: 'recommendation',
                message: "Here are some amazing science fiction books:",
                recommendations: scifiBooks
            };
        } else {
            response = {
                type: 'text',
                message: mockAIResponses.chatbot.default
            };
        }

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message'
        });
    }
});

// AI Search Routes - Modified to work without OpenAI
router.get('/search/autocomplete', async (req, res) => {
    try {
        const { query, limit = 8 } = req.query;

        if (!query || query.length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        // Generate suggestions based on sample data
        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Add book titles
        sampleData.books.forEach(book => {
            if (book.title.toLowerCase().includes(lowerQuery)) {
                suggestions.push(book.title);
            }
        });

        // Add authors
        sampleData.books.forEach(book => {
            if (book.author.toLowerCase().includes(lowerQuery)) {
                suggestions.push(book.author);
            }
        });

        // Add categories/genres
        const categories = ['fiction', 'mystery', 'sci-fi', 'romance', 'textbooks', 'programming'];
        categories.forEach(category => {
            if (category.includes(lowerQuery)) {
                suggestions.push(category);
            }
        });

        // Remove duplicates and limit results
        const uniqueSuggestions = [...new Set(suggestions)].slice(0, parseInt(limit));

        res.json({
            success: true,
            suggestions: uniqueSuggestions
        });
    } catch (error) {
        console.error('Search autocomplete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get search suggestions'
        });
    }
});

// AI Content Analysis - Modified to work without OpenAI
router.post('/content/analyze', async (req, res) => {
    try {
        const { text, type = 'general' } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        // Mock content analysis
        const analysis = {
            sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
            keywords: ['book', 'reading', 'literature', 'knowledge'],
            summary: 'This appears to be a book-related text with positive sentiment.',
            score: Math.floor(Math.random() * 40 + 60), // Random score between 60-100
            type: type
        };

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Content analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze content'
        });
    }
});

// AI Status endpoint
router.get('/status', async (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        features: {
            recommendations: 'available',
            chatbot: 'available',
            search: 'available',
            contentAnalysis: 'available'
        },
        message: 'AI features are running with mock responses (no OpenAI API key required)'
    });
});

// Test endpoint for AI features
router.get('/test', async (req, res) => {
    try {
        const testData = {
            recommendations: sampleData.books.slice(0, 3).map(book => ({
                ...book,
                aiScore: 95,
                reason: "Test recommendation"
            })),
            chatbot: mockAIResponses.chatbot.greeting,
            search: ['The Great Gatsby', 'Dune', 'Clean Code'],
            sampleData: sampleData.books.length
        };
        
        res.json({
            success: true,
            message: 'AI test endpoint working',
            data: testData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'AI test failed',
            details: error.message
        });
    }
});

module.exports = router; 