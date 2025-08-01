// backend/utils/aiRecommendations.js
const User = require('../models/User');
const Book = require('../models/Book');
const { aiConfig } = require('../config/ai');
const natural = require('natural');
const { Matrix } = require('ml-matrix');
const kmeans = require('ml-kmeans');
const { distance } = require('ml-distance');

class AIRecommendationEngine {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.userSimilarityMatrix = null;
        this.bookSimilarityMatrix = null;
    }

    // Content-based filtering
    async getContentBasedRecommendations(userId, limit = 10) {
        try {
            const user = await User.findById(userId).populate('behavior.purchaseHistory.bookId');
            if (!user) return [];

            const userPreferences = this.extractUserPreferences(user);
            const availableBooks = await Book.find({ 
                status: 'available',
                seller: { $ne: userId }
            });

            const recommendations = availableBooks.map(book => {
                const score = this.calculateContentSimilarity(userPreferences, book);
                return { book, score };
            });

            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => item.book);
        } catch (error) {
            console.error('Content-based recommendation error:', error);
            return [];
        }
    }

    // Collaborative filtering
    async getCollaborativeRecommendations(userId, limit = 10) {
        try {
            const users = await User.find().populate('behavior.ratings.bookId');
            const books = await Book.find({ status: 'available' });
            
            // Create user-item matrix
            const userItemMatrix = this.createUserItemMatrix(users, books);
            
            // Find similar users
            const similarUsers = this.findSimilarUsers(userId, users, userItemMatrix);
            
            // Get recommendations from similar users
            const recommendations = this.getRecommendationsFromSimilarUsers(
                userId, similarUsers, books, limit
            );

            return recommendations;
        } catch (error) {
            console.error('Collaborative recommendation error:', error);
            return [];
        }
    }

    // Hybrid recommendations
    async getHybridRecommendations(userId, limit = 10) {
        try {
            const [contentBased, collaborative] = await Promise.all([
                this.getContentBasedRecommendations(userId, limit * 2),
                this.getCollaborativeRecommendations(userId, limit * 2)
            ]);

            // Combine and rank recommendations
            const combined = this.combineRecommendations(
                contentBased, 
                collaborative, 
                aiConfig.recommendations.hybrid
            );

            return combined.slice(0, limit);
        } catch (error) {
            console.error('Hybrid recommendation error:', error);
            return [];
        }
    }

    // Real-time recommendations based on current session
    async getRealTimeRecommendations(userId, currentBookId = null, limit = 10) {
        try {
            const user = await User.findById(userId);
            if (!user) return [];

            let recommendations = [];

            if (currentBookId) {
                // Get similar books to the one currently being viewed
                const currentBook = await Book.findById(currentBookId);
                if (currentBook) {
                    const similarBooks = await this.getSimilarBooks(currentBook, limit);
                    recommendations = similarBooks;
                }
            } else {
                // Get general recommendations
                recommendations = await this.getHybridRecommendations(userId, limit);
            }

            // Update user behavior
            if (currentBookId) {
                await this.updateUserBehavior(userId, currentBookId, 'view');
            }

            return recommendations;
        } catch (error) {
            console.error('Real-time recommendation error:', error);
            return [];
        }
    }

    // Helper methods
    extractUserPreferences(user) {
        const preferences = {
            categories: {},
            authors: {},
            genres: {},
            priceRange: user.aiProfile?.priceRange || { min: 0, max: 10000 },
            readingLevel: user.aiProfile?.readingLevel || 'intermediate'
        };

        // Extract from purchase history
        user.behavior.purchaseHistory.forEach(purchase => {
            if (purchase.bookId) {
                const book = purchase.bookId;
                preferences.categories[book.category] = (preferences.categories[book.category] || 0) + 1;
                preferences.authors[book.author] = (preferences.authors[book.author] || 0) + 1;
                if (book.genre) {
                    preferences.genres[book.genre] = (preferences.genres[book.genre] || 0) + 1;
                }
            }
        });

        // Extract from ratings
        user.behavior.ratings.forEach(rating => {
            if (rating.bookId) {
                const book = rating.bookId;
                const weight = rating.rating / 5; // Normalize rating
                preferences.categories[book.category] = (preferences.categories[book.category] || 0) + weight;
                preferences.authors[book.author] = (preferences.authors[book.author] || 0) + weight;
                if (book.genre) {
                    preferences.genres[book.genre] = (preferences.genres[book.genre] || 0) + weight;
                }
            }
        });

        return preferences;
    }

    calculateContentSimilarity(userPreferences, book) {
        const weights = aiConfig.recommendations.contentWeights;
        let score = 0;

        // Category similarity
        if (userPreferences.categories[book.category]) {
            score += weights.category * (userPreferences.categories[book.category] / 10);
        }

        // Author similarity
        if (userPreferences.authors[book.author]) {
            score += weights.author * (userPreferences.authors[book.author] / 10);
        }

        // Genre similarity
        if (book.genre && userPreferences.genres[book.genre]) {
            score += weights.genre * (userPreferences.genres[book.genre] / 10);
        }

        // Price similarity
        const priceScore = this.calculatePriceSimilarity(book.price, userPreferences.priceRange);
        score += weights.price * priceScore;

        // Condition similarity
        const conditionScore = this.calculateConditionScore(book.condition);
        score += weights.condition * conditionScore;

        return score;
    }

    calculatePriceSimilarity(bookPrice, userPriceRange) {
        if (bookPrice >= userPriceRange.min && bookPrice <= userPriceRange.max) {
            return 1.0;
        }
        
        const midPrice = (userPriceRange.min + userPriceRange.max) / 2;
        const distance = Math.abs(bookPrice - midPrice);
        const range = userPriceRange.max - userPriceRange.min;
        
        return Math.max(0, 1 - (distance / range));
    }

    calculateConditionScore(condition) {
        const conditionScores = {
            'new': 1.0,
            'like-new': 0.9,
            'very-good': 0.8,
            'good': 0.7,
            'acceptable': 0.5
        };
        return conditionScores[condition] || 0.5;
    }

    createUserItemMatrix(users, books) {
        const matrix = [];
        const bookMap = new Map(books.map((book, index) => [book._id.toString(), index]));

        users.forEach(user => {
            const row = new Array(books.length).fill(0);
            user.behavior.ratings.forEach(rating => {
                const bookIndex = bookMap.get(rating.bookId.toString());
                if (bookIndex !== undefined) {
                    row[bookIndex] = rating.rating;
                }
            });
            matrix.push(row);
        });

        return new Matrix(matrix);
    }

    findSimilarUsers(userId, users, userItemMatrix) {
        const userIndex = users.findIndex(u => u._id.toString() === userId.toString());
        if (userIndex === -1) return [];

        const userVector = userItemMatrix.getRow(userIndex);
        const similarities = [];

        for (let i = 0; i < users.length; i++) {
            if (i === userIndex) continue;
            
            const otherVector = userItemMatrix.getRow(i);
            const similarity = this.calculateCosineSimilarity(userVector, otherVector);
            
            if (similarity > aiConfig.recommendations.collaborative.similarityThreshold) {
                similarities.push({ user: users[i], similarity });
            }
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, aiConfig.recommendations.collaborative.minSimilarUsers);
    }

    calculateCosineSimilarity(vector1, vector2) {
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        return dotProduct / (magnitude1 * magnitude2);
    }

    getRecommendationsFromSimilarUsers(userId, similarUsers, books, limit) {
        const bookScores = new Map();

        similarUsers.forEach(({ user, similarity }) => {
            user.behavior.ratings.forEach(rating => {
                if (rating.rating >= 4) { // Only consider positive ratings
                    const bookId = rating.bookId.toString();
                    const currentScore = bookScores.get(bookId) || 0;
                    bookScores.set(bookId, currentScore + (rating.rating * similarity));
                }
            });
        });

        const recommendations = Array.from(bookScores.entries())
            .map(([bookId, score]) => ({ bookId, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return recommendations.map(rec => 
            books.find(book => book._id.toString() === rec.bookId)
        ).filter(Boolean);
    }

    combineRecommendations(contentBased, collaborative, weights) {
        const combined = new Map();

        // Add content-based recommendations
        contentBased.forEach((book, index) => {
            const score = weights.contentBased * (1 - index / contentBased.length);
            combined.set(book._id.toString(), { book, score });
        });

        // Add collaborative recommendations
        collaborative.forEach((book, index) => {
            const bookId = book._id.toString();
            const existing = combined.get(bookId);
            const score = weights.collaborative * (1 - index / collaborative.length);
            
            if (existing) {
                existing.score += score;
            } else {
                combined.set(bookId, { book, score });
            }
        });

        return Array.from(combined.values())
            .sort((a, b) => b.score - a.score)
            .map(item => item.book);
    }

    async getSimilarBooks(book, limit = 5) {
        try {
            const similarBooks = await Book.find({
                _id: { $ne: book._id },
                status: 'available',
                category: book.category
            }).limit(limit);

            return similarBooks.map(similarBook => ({
                ...similarBook.toObject(),
                similarityScore: this.calculateBookSimilarity(book, similarBook)
            })).sort((a, b) => b.similarityScore - a.similarityScore);
        } catch (error) {
            console.error('Error finding similar books:', error);
            return [];
        }
    }

    calculateBookSimilarity(book1, book2) {
        let score = 0;

        // Category similarity
        if (book1.category === book2.category) score += 0.3;

        // Author similarity
        if (book1.author === book2.author) score += 0.25;

        // Genre similarity
        if (book1.genre === book2.genre) score += 0.2;

        // Price similarity
        const priceDiff = Math.abs(book1.price - book2.price) / Math.max(book1.price, book2.price);
        score += 0.15 * (1 - priceDiff);

        // Condition similarity
        if (book1.condition === book2.condition) score += 0.1;

        return score;
    }

    async updateUserBehavior(userId, bookId, action) {
        try {
            const update = {};
            
            switch (action) {
                case 'view':
                    update.$push = {
                        'behavior.viewHistory': {
                            bookId,
                            timestamp: new Date(),
                            duration: 30 // Default 30 seconds
                        }
                    };
                    break;
                case 'purchase':
                    update.$push = {
                        'behavior.purchaseHistory': {
                            bookId,
                            timestamp: new Date(),
                            price: 0 // Will be updated with actual price
                        }
                    };
                    break;
                case 'wishlist':
                    update.$push = {
                        'behavior.wishlistItems': {
                            bookId,
                            addedAt: new Date()
                        }
                    };
                    break;
            }

            if (Object.keys(update).length > 0) {
                await User.findByIdAndUpdate(userId, update);
            }
        } catch (error) {
            console.error('Error updating user behavior:', error);
        }
    }
}

module.exports = new AIRecommendationEngine(); 