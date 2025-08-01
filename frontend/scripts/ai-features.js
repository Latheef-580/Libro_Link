// AI Features for LibroLink
// Handles AI-powered search suggestions and recommendations

class AIFeatures {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchSuggestions = document.getElementById('aiSearchSuggestions');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.recommendationsSection = document.getElementById('aiRecommendationsSection');
        this.recommendationsGrid = document.getElementById('recommendationsGrid');
        this.refreshRecommendationsBtn = document.getElementById('refreshRecommendations');
        
        this.searchTimeout = null;
        this.isUserLoggedIn = false;
        
        this.init();
    }

    init() {
        this.checkUserLogin();
        this.bindEvents();
        this.loadRecommendations();
    }

    checkUserLogin() {
        const currentUser = localStorage.getItem('currentUser');
        this.isUserLoggedIn = !!currentUser;
    }

    bindEvents() {
        // Search input events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            this.searchInput.addEventListener('focus', () => {
                if (this.searchInput.value.length >= 2) {
                    this.showSuggestions();
                }
            });

            this.searchInput.addEventListener('blur', () => {
                // Delay hiding suggestions to allow clicks
                setTimeout(() => {
                    this.hideSuggestions();
                }, 200);
            });
        }

        // Refresh recommendations
        if (this.refreshRecommendationsBtn) {
            this.refreshRecommendationsBtn.addEventListener('click', () => {
                this.loadRecommendations();
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput?.contains(e.target) && !this.searchSuggestions?.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    async handleSearchInput(query) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Hide suggestions if query is too short
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        // Set timeout to avoid too many API calls
        this.searchTimeout = setTimeout(async () => {
            await this.getSearchSuggestions(query);
        }, 300);
    }

    async getSearchSuggestions(query) {
        try {
            const response = await fetch(`/api/ai/search/autocomplete?query=${encodeURIComponent(query)}&limit=8`);
            const data = await response.json();

            if (data.success && data.suggestions && data.suggestions.length > 0) {
                this.displaySuggestions(data.suggestions, query);
                this.showSuggestions();
            } else {
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('Error getting search suggestions:', error);
            this.hideSuggestions();
        }
    }

    displaySuggestions(suggestions, query) {
        if (!this.suggestionsList) return;

        const suggestionsHtml = suggestions.map(suggestion => {
            const icon = this.getSuggestionIcon(suggestion);
            const type = this.getSuggestionType(suggestion);
            
            return `
                <div class="suggestion-item" onclick="aiFeatures.selectSuggestion('${suggestion}')">
                    <i class="${icon}"></i>
                    <div class="suggestion-text">${suggestion}</div>
                    <div class="suggestion-type">${type}</div>
                </div>
            `;
        }).join('');

        this.suggestionsList.innerHTML = suggestionsHtml;
    }

    getSuggestionIcon(suggestion) {
        // Determine icon based on suggestion content
        const lowerSuggestion = suggestion.toLowerCase();
        
        if (lowerSuggestion.includes('fiction') || lowerSuggestion.includes('novel')) {
            return 'fas fa-book-open';
        } else if (lowerSuggestion.includes('mystery') || lowerSuggestion.includes('thriller')) {
            return 'fas fa-search';
        } else if (lowerSuggestion.includes('romance')) {
            return 'fas fa-heart';
        } else if (lowerSuggestion.includes('sci-fi') || lowerSuggestion.includes('science')) {
            return 'fas fa-rocket';
        } else if (lowerSuggestion.includes('history')) {
            return 'fas fa-landmark';
        } else if (lowerSuggestion.includes('biography')) {
            return 'fas fa-user';
        } else {
            return 'fas fa-book';
        }
    }

    getSuggestionType(suggestion) {
        // Determine type based on suggestion content
        const lowerSuggestion = suggestion.toLowerCase();
        
        if (lowerSuggestion.includes('fiction') || lowerSuggestion.includes('novel') || 
            lowerSuggestion.includes('mystery') || lowerSuggestion.includes('romance') ||
            lowerSuggestion.includes('sci-fi')) {
            return 'Genre';
        } else if (lowerSuggestion.includes('author') || lowerSuggestion.includes('writer')) {
            return 'Author';
        } else {
            return 'Category';
        }
    }

    selectSuggestion(suggestion) {
        if (this.searchInput) {
            this.searchInput.value = suggestion;
            this.hideSuggestions();
            
            // Trigger search
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.click();
            }
        }
    }

    showSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'block';
        }
    }

    hideSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'none';
        }
    }

    async loadRecommendations() {
        try {
            // Try to get AI recommendations first
            const response = await fetch('/api/ai/recommendations?type=hybrid&limit=6');
            const data = await response.json();

            if (data.success && data.recommendations && data.recommendations.length > 0) {
                this.displayRecommendations(data.recommendations, true);
                this.showRecommendationsSection();
            } else {
                // Fallback to popular books
                await this.loadPopularBooks();
            }
        } catch (error) {
            console.error('Error loading AI recommendations, trying popular books:', error);
            await this.loadPopularBooks();
        }
    }

    async loadPopularBooks() {
        try {
            const response = await fetch('/api/books?sortBy=views&sortOrder=desc&limit=6');
            const data = await response.json();

            if (data.books && data.books.length > 0) {
                this.displayRecommendations(data.books, false);
                this.showRecommendationsSection();
            } else {
                // Fallback to sample data if no books returned
                await this.loadSampleData();
            }
        } catch (error) {
            console.error('Error loading popular books, trying sample data:', error);
            await this.loadSampleData();
        }
    }

    async loadSampleData() {
        try {
            const sampleResponse = await fetch('/api/books/sample');
            const sampleData = await sampleResponse.json();
            if (sampleData.books && sampleData.books.length > 0) {
                // Take first 6 books from sample data
                const popularBooks = sampleData.books.slice(0, 6);
                this.displayRecommendations(popularBooks, false);
                this.showRecommendationsSection();
            }
        } catch (sampleError) {
            console.error('Error loading sample data for recommendations:', sampleError);
        }
    }

    displayRecommendations(books, isAI = true) {
        if (!this.recommendationsGrid) return;

        const recommendationsHtml = books.map(book => {
            const imageUrl = book.coverImage || book.images?.[0]?.url || '/assets/images/placeholder-book.jpg';
            const score = isAI ? Math.floor(Math.random() * 20 + 80) : null; // Mock AI score
            
            return `
                <div class="ai-recommendation-card" onclick="aiFeatures.viewBook('${book.id || book._id}')">
                    ${score ? `<div class="ai-recommendation-score">${score}%</div>` : ''}
                    <img src="${imageUrl}" alt="${book.title}" class="ai-recommendation-image">
                    <div class="ai-recommendation-title">${book.title}</div>
                    <div class="ai-recommendation-author">by ${book.author}</div>
                    <div class="ai-recommendation-price">₹${Number(book.price).toFixed(2)}</div>
                </div>
            `;
        }).join('');

        this.recommendationsGrid.innerHTML = recommendationsHtml;
    }

    showRecommendationsSection() {
        if (this.recommendationsSection) {
            this.recommendationsSection.style.display = 'block';
        }
    }

    hideRecommendationsSection() {
        if (this.recommendationsSection) {
            this.recommendationsSection.style.display = 'none';
        }
    }

    viewBook(bookId) {
        // Navigate to book details page
        window.location.href = `/book-details.html?id=${bookId}`;
    }

    // Public method to refresh recommendations
    refreshRecommendations() {
        this.loadRecommendations();
    }
}

// Initialize AI Features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiFeatures = new AIFeatures();
}); 