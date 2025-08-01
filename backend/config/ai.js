// backend/config/ai.js
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});

// AI Configuration
const aiConfig = {
    // OpenAI Configuration
    openai: {
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
    },
    
    // Recommendation Engine Configuration
    recommendations: {
        // Content-based filtering weights
        contentWeights: {
            category: 0.3,
            author: 0.25,
            genre: 0.2,
            price: 0.15,
            condition: 0.1
        },
        
        // Collaborative filtering parameters
        collaborative: {
            minSimilarUsers: 3,
            maxRecommendations: 10,
            similarityThreshold: 0.3
        },
        
        // Hybrid recommendation weights
        hybrid: {
            contentBased: 0.4,
            collaborative: 0.4,
            popularity: 0.2
        }
    },
    
    // Search Configuration
    search: {
        semanticSearchEnabled: true,
        autoCompleteMaxResults: 5,
        voiceSearchEnabled: true,
        imageSearchEnabled: true
    },
    
    // Chatbot Configuration
    chatbot: {
        enabled: true,
        maxContextLength: 10,
        responseTimeout: 30000,
        fallbackResponses: [
            "I'm sorry, I didn't understand that. Could you please rephrase?",
            "I'm here to help with book recommendations and general queries. How can I assist you?",
            "Let me help you find the perfect book. What genre are you interested in?"
        ]
    },
    
    // Analytics Configuration
    analytics: {
        userBehaviorTracking: true,
        churnPredictionEnabled: true,
        personalizedNotifications: true,
        emailCampaigns: true
    }
};

module.exports = { openai, aiConfig }; 