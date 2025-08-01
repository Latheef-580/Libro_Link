// backend/utils/aiSearch.js
const natural = require('natural');
const { openai, aiConfig } = require('../config/ai');
const Book = require('../models/Book');
const User = require('../models/User');

class AISearchService {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.searchIndex = new Map();
        this.initializeSearchIndex();
    }

    async initializeSearchIndex() {
        try {
            const books = await Book.find({ status: 'available' });
            
            books.forEach(book => {
                const document = this.createSearchDocument(book);
                this.tfidf.addDocument(document, book._id.toString());
            });

            console.log('Search index initialized with', books.length, 'books');
        } catch (error) {
            console.error('Error initializing search index:', error);
        }
    }

    createSearchDocument(book) {
        return [
            book.title,
            book.author,
            book.description,
            book.category,
            book.genre,
            book.tags?.join(' ') || '',
            book.aiFeatures?.keywords?.join(' ') || '',
            book.aiFeatures?.aiTags?.join(' ') || ''
        ].join(' ').toLowerCase();
    }

    // Semantic search using OpenAI embeddings
    async semanticSearch(query, limit = 10) {
        try {
            if (!aiConfig.search.semanticSearchEnabled) {
                return await this.basicSearch(query, limit);
            }

            // Get query embedding
            const queryEmbedding = await this.getEmbedding(query);
            
            // Get all books with their embeddings
            const books = await Book.find({ 
                status: 'available',
                'aiFeatures.contentVector': { $exists: true, $ne: [] }
            });

            // Calculate similarities
            const similarities = books.map(book => ({
                book,
                similarity: this.calculateCosineSimilarity(queryEmbedding, book.aiFeatures.contentVector)
            }));

            // Sort by similarity and return top results
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map(item => item.book);

        } catch (error) {
            console.error('Semantic search error:', error);
            return await this.basicSearch(query, limit);
        }
    }

    // Basic TF-IDF search
    async basicSearch(query, limit = 10) {
        try {
            const results = this.tfidf.tfidfs(query.toLowerCase());
            const bookIds = results
                .map((score, index) => ({ score, bookId: this.tfidf.documents[index] }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => item.bookId);

            const books = await Book.find({
                _id: { $in: bookIds },
                status: 'available'
            });

            return books;
        } catch (error) {
            console.error('Basic search error:', error);
            return [];
        }
    }

    // Auto-complete with intelligent suggestions
    async getAutoCompleteSuggestions(query, limit = 5) {
        try {
            if (!query || query.length < 2) return [];

            const suggestions = new Set();
            const lowerQuery = query.toLowerCase();

            // Search in titles
            const titleMatches = await Book.find({
                title: { $regex: lowerQuery, $options: 'i' },
                status: 'available'
            }).limit(limit);

            titleMatches.forEach(book => {
                suggestions.add(book.title);
            });

            // Search in authors
            const authorMatches = await Book.find({
                author: { $regex: lowerQuery, $options: 'i' },
                status: 'available'
            }).limit(limit);

            authorMatches.forEach(book => {
                suggestions.add(book.author);
            });

            // Search in categories
            const categoryMatches = await Book.find({
                category: { $regex: lowerQuery, $options: 'i' },
                status: 'available'
            }).limit(limit);

            categoryMatches.forEach(book => {
                suggestions.add(book.category);
            });

            // Search in genres
            const genreMatches = await Book.find({
                genre: { $regex: lowerQuery, $options: 'i' },
                status: 'available'
            }).limit(limit);

            genreMatches.forEach(book => {
                if (book.genre) suggestions.add(book.genre);
            });

            // Convert to array and sort by relevance
            const suggestionsArray = Array.from(suggestions);
            return suggestionsArray
                .sort((a, b) => {
                    // Prioritize exact matches
                    const aExact = a.toLowerCase().startsWith(lowerQuery);
                    const bExact = b.toLowerCase().startsWith(lowerQuery);
                    
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    
                    // Then by length (shorter is better for auto-complete)
                    return a.length - b.length;
                })
                .slice(0, limit);

        } catch (error) {
            console.error('Auto-complete error:', error);
            return [];
        }
    }

    // Voice search processing
    async processVoiceSearch(audioData, userId = null) {
        try {
            if (!aiConfig.search.voiceSearchEnabled) {
                throw new Error('Voice search is not enabled');
            }

            // Convert audio to text (this would require additional audio processing)
            // For now, we'll simulate this with a placeholder
            const transcribedText = await this.transcribeAudio(audioData);
            
            // Process the transcribed text
            return await this.semanticSearch(transcribedText, 10);

        } catch (error) {
            console.error('Voice search error:', error);
            return [];
        }
    }

    // Image-based book search
    async imageBasedSearch(imageData, limit = 10) {
        try {
            if (!aiConfig.search.imageSearchEnabled) {
                throw new Error('Image search is not enabled');
            }

            // Extract text from image using OCR
            const extractedText = await this.extractTextFromImage(imageData);
            
            // Search for books based on extracted text
            const results = await this.semanticSearch(extractedText, limit);
            
            return results;

        } catch (error) {
            console.error('Image search error:', error);
            return [];
        }
    }

    // Advanced search with filters
    async advancedSearch(params, limit = 20) {
        try {
            const {
                query,
                category,
                genre,
                author,
                minPrice,
                maxPrice,
                condition,
                sortBy = 'relevance',
                userId = null
            } = params;

            let searchQuery = { status: 'available' };

            // Add filters
            if (category) searchQuery.category = category;
            if (genre) searchQuery.genre = genre;
            if (author) searchQuery.author = { $regex: author, $options: 'i' };
            if (condition) searchQuery.condition = condition;
            if (minPrice || maxPrice) {
                searchQuery.price = {};
                if (minPrice) searchQuery.price.$gte = minPrice;
                if (maxPrice) searchQuery.price.$lte = maxPrice;
            }

            let books = [];

            if (query) {
                // Use semantic search if query is provided
                books = await this.semanticSearch(query, limit * 2);
                // Apply additional filters
                books = books.filter(book => {
                    if (category && book.category !== category) return false;
                    if (genre && book.genre !== genre) return false;
                    if (author && !book.author.toLowerCase().includes(author.toLowerCase())) return false;
                    if (minPrice && book.price < minPrice) return false;
                    if (maxPrice && book.price > maxPrice) return false;
                    if (condition && book.condition !== condition) return false;
                    return true;
                });
            } else {
                // Use basic filtered search
                books = await Book.find(searchQuery).limit(limit * 2);
            }

            // Sort results
            books = this.sortBooks(books, sortBy, userId);

            return books.slice(0, limit);

        } catch (error) {
            console.error('Advanced search error:', error);
            return [];
        }
    }

    // Sort books based on various criteria
    sortBooks(books, sortBy, userId = null) {
        switch (sortBy) {
            case 'price_low':
                return books.sort((a, b) => a.price - b.price);
            case 'price_high':
                return books.sort((a, b) => b.price - a.price);
            case 'newest':
                return books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popularity':
                return books.sort((a, b) => (b.analytics?.viewCount || 0) - (a.analytics?.viewCount || 0));
            case 'rating':
                return books.sort((a, b) => (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0));
            case 'relevance':
            default:
                // Keep original order (already sorted by relevance from search)
                return books;
        }
    }

    // Get search suggestions based on user behavior
    async getPersonalizedSuggestions(userId, limit = 5) {
        try {
            const user = await User.findById(userId);
            if (!user) return [];

            const suggestions = [];

            // Based on recent searches
            if (user.behavior.searchHistory.length > 0) {
                const recentSearches = user.behavior.searchHistory
                    .slice(-5)
                    .map(search => search.query);
                suggestions.push(...recentSearches);
            }

            // Based on viewed books
            if (user.behavior.viewHistory.length > 0) {
                const viewedBooks = await Book.find({
                    _id: { $in: user.behavior.viewHistory.map(v => v.bookId) }
                });
                
                viewedBooks.forEach(book => {
                    if (book.category) suggestions.push(book.category);
                    if (book.genre) suggestions.push(book.genre);
                    suggestions.push(book.author);
                });
            }

            // Based on user preferences
            if (user.aiProfile) {
                suggestions.push(...user.aiProfile.favoriteGenres);
                suggestions.push(...user.aiProfile.favoriteAuthors);
            }

            // Remove duplicates and return
            return [...new Set(suggestions)].slice(0, limit);

        } catch (error) {
            console.error('Personalized suggestions error:', error);
            return [];
        }
    }

    // Helper methods
    async getEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error getting embedding:', error);
            return [];
        }
    }

    calculateCosineSimilarity(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) return 0;
        
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        return dotProduct / (magnitude1 * magnitude2);
    }

    async transcribeAudio(audioData) {
        // Placeholder for audio transcription
        // In a real implementation, you would use OpenAI's Whisper API or similar
        throw new Error('Audio transcription not implemented');
    }

    async extractTextFromImage(imageData) {
        // Placeholder for OCR
        // In a real implementation, you would use OCR services
        throw new Error('OCR not implemented');
    }

    // Update search index when books are added/modified
    async updateSearchIndex(bookId) {
        try {
            const book = await Book.findById(bookId);
            if (!book) return;

            // Remove old entry
            this.tfidf.documents = this.tfidf.documents.filter(doc => doc !== bookId.toString());
            
            // Add new entry
            const document = this.createSearchDocument(book);
            this.tfidf.addDocument(document, bookId.toString());

        } catch (error) {
            console.error('Error updating search index:', error);
        }
    }

    // Get search statistics
    getSearchStats() {
        return {
            indexedDocuments: this.tfidf.documents.length,
            searchIndexSize: this.searchIndex.size
        };
    }
}

module.exports = new AISearchService(); 