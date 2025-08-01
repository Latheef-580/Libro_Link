// AI Content Analysis Features for LibroLink
// Handles AI description generation, price optimization, trend analysis, and sentiment analysis

class AIContentAnalysis {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTrends();
    }

    bindEvents() {
        // AI Description Generation
        const generateDescriptionBtn = document.getElementById('generateDescriptionBtn');
        if (generateDescriptionBtn) {
            generateDescriptionBtn.addEventListener('click', () => {
                this.generateBookDescription();
            });
        }

        // Price Optimization
        const optimizePriceBtn = document.getElementById('optimizePriceBtn');
        if (optimizePriceBtn) {
            optimizePriceBtn.addEventListener('click', () => {
                this.optimizePrice();
            });
        }

        // Trend Analysis
        const refreshTrendsBtn = document.getElementById('refreshTrendsBtn');
        if (refreshTrendsBtn) {
            refreshTrendsBtn.addEventListener('click', () => {
                this.loadTrends();
            });
        }

        const trendPeriod = document.getElementById('trendPeriod');
        if (trendPeriod) {
            trendPeriod.addEventListener('change', () => {
                this.loadTrends();
            });
        }
    }

    async generateBookDescription() {
        const title = document.getElementById('bookTitle')?.value;
        const author = document.getElementById('bookAuthor')?.value;
        const category = document.getElementById('bookCategory')?.value;
        const genre = document.getElementById('bookGenre')?.value;
        const condition = document.getElementById('bookCondition')?.value;
        const pages = document.getElementById('bookPageCount')?.value;
        const publishedYear = document.getElementById('bookPublicationYear')?.value;

        if (!title || !author) {
            alert('Please fill in the book title and author first.');
            return;
        }

        const loadingEl = document.getElementById('aiDescriptionLoading');
        const generateBtn = document.getElementById('generateDescriptionBtn');
        const descriptionTextarea = document.getElementById('bookDescription');

        if (loadingEl) loadingEl.style.display = 'block';
        if (generateBtn) generateBtn.disabled = true;

        try {
            const response = await fetch('/api/ai/content/generate-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title,
                    author,
                    category,
                    genre,
                    condition,
                    pages,
                    publishedYear
                })
            });

            const data = await response.json();

            if (data.success && descriptionTextarea) {
                descriptionTextarea.value = data.description;
                // Trigger input event to update any character counters
                descriptionTextarea.dispatchEvent(new Event('input'));
            } else {
                alert('Failed to generate description. Please try again.');
            }
        } catch (error) {
            console.error('Error generating description:', error);
            alert('Error generating description. Please try again.');
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
            if (generateBtn) generateBtn.disabled = false;
        }
    }

    async optimizePrice() {
        const priceInput = document.getElementById('bookPrice');
        const categoryInput = document.getElementById('bookCategory');
        const conditionInput = document.getElementById('bookCondition');

        if (!priceInput?.value || !categoryInput?.value || !conditionInput?.value) {
            alert('Please fill in price, category, and condition first.');
            return;
        }

        // For new books being created, we'll use the form data
        const bookData = {
            price: parseFloat(priceInput.value),
            category: categoryInput.value,
            condition: conditionInput.value
        };

        const optimizationResults = document.getElementById('priceOptimizationResults');
        const optimizationContent = document.getElementById('optimizationContent');

        if (optimizationResults) optimizationResults.style.display = 'block';
        if (optimizationContent) {
            optimizationContent.innerHTML = '<p>Analyzing market prices...</p>';
        }

        try {
            // For new books, we'll simulate optimization based on similar books
            const response = await fetch(`/api/books?category=${bookData.category}&condition=${bookData.condition}&limit=10`);
            const data = await response.json();

            if (data.books && data.books.length > 0) {
                const prices = data.books.map(book => book.price).filter(p => p > 0);
                const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const suggestedPrice = Math.round(avgPrice * 0.95);

                let recommendation = '';
                if (bookData.price > avgPrice * 1.1) {
                    recommendation = 'Consider lowering your price to be more competitive';
                } else if (bookData.price < avgPrice * 0.9) {
                    recommendation = 'Your price is competitive, but you might be underpricing';
                } else {
                    recommendation = 'Your price is well-positioned in the market';
                }

                if (optimizationContent) {
                    optimizationContent.innerHTML = `
                        <div class="optimization-item">
                            <div class="optimization-label">Current Price</div>
                            <div class="optimization-value">₹${bookData.price}</div>
                        </div>
                        <div class="optimization-item">
                            <div class="optimization-label">Suggested Price</div>
                            <div class="optimization-value">₹${suggestedPrice}</div>
                        </div>
                        <div class="optimization-item">
                            <div class="optimization-label">Market Average</div>
                            <div class="optimization-value">₹${Math.round(avgPrice)}</div>
                        </div>
                        <div class="optimization-item">
                            <div class="optimization-label">Price Range</div>
                            <div class="optimization-value">₹${minPrice} - ₹${maxPrice}</div>
                        </div>
                        <div class="optimization-recommendation">
                            <i class="fas fa-lightbulb"></i> ${recommendation}
                        </div>
                    `;
                }
            } else {
                if (optimizationContent) {
                    optimizationContent.innerHTML = '<p>No similar books found for comparison.</p>';
                }
            }
        } catch (error) {
            console.error('Error optimizing price:', error);
            if (optimizationContent) {
                optimizationContent.innerHTML = '<p>Unable to analyze pricing at this time.</p>';
            }
        }
    }

    async loadTrends() {
        const period = document.getElementById('trendPeriod')?.value || '30d';
        const trendingBooksList = document.getElementById('trendingBooksList');
        const categoryTrendsList = document.getElementById('categoryTrendsList');

        if (trendingBooksList) {
            trendingBooksList.innerHTML = '<p>Loading trending books...</p>';
        }
        if (categoryTrendsList) {
            categoryTrendsList.innerHTML = '<p>Loading category trends...</p>';
        }

        try {
            // Load trending books
            const booksResponse = await fetch(`/api/ai/trends/books?period=${period}&limit=5`);
            const booksData = await booksResponse.json();

            if (booksData.success && trendingBooksList) {
                if (booksData.trends.length > 0) {
                    const booksHtml = booksData.trends.map(book => `
                        <div class="trending-book-item">
                            <div class="trending-book-info">
                                <div class="trending-book-title">${book.title}</div>
                                <div class="trending-book-author">by ${book.author}</div>
                            </div>
                            <div class="trending-book-stats">
                                <div class="trending-book-price">₹${book.price}</div>
                                <div class="trending-book-views">${book.views} views</div>
                            </div>
                        </div>
                    `).join('');
                    trendingBooksList.innerHTML = booksHtml;
                } else {
                    trendingBooksList.innerHTML = '<p>No trending books found.</p>';
                }
            }

            // Load category trends
            const categoriesResponse = await fetch(`/api/ai/trends/categories?period=${period}`);
            const categoriesData = await categoriesResponse.json();

            if (categoriesData.success && categoryTrendsList) {
                if (categoriesData.trends.length > 0) {
                    const categoriesHtml = categoriesData.trends.map(cat => `
                        <div class="category-trend-item">
                            <div class="category-trend-info">
                                <div class="category-trend-name">${cat.category}</div>
                                <div class="category-trend-stats">${cat.totalBooks} books • ₹${cat.avgPrice} avg</div>
                            </div>
                            <div class="category-trend-score">${Math.round(cat.popularityScore)}</div>
                        </div>
                    `).join('');
                    categoryTrendsList.innerHTML = categoriesHtml;
                } else {
                    categoryTrendsList.innerHTML = '<p>No category trends found.</p>';
                }
            }
        } catch (error) {
            console.error('Error loading trends:', error);
            if (trendingBooksList) {
                trendingBooksList.innerHTML = '<p>Unable to load trending books.</p>';
            }
            if (categoryTrendsList) {
                categoryTrendsList.innerHTML = '<p>Unable to load category trends.</p>';
            }
        }
    }

    async analyzeReviewSentiment(reviewText) {
        try {
            const response = await fetch('/api/ai/content/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    text: reviewText,
                    type: 'sentiment'
                })
            });

            const data = await response.json();
            return data.success ? data.analysis.sentiment : 'neutral';
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return 'neutral';
        }
    }

    async updateReviewSentiment(reviewElement, reviewText) {
        const sentiment = await this.analyzeReviewSentiment(reviewText);
        
        // Add sentiment indicator to review
        const sentimentIndicator = document.createElement('div');
        sentimentIndicator.className = `review-sentiment ${sentiment}`;
        sentimentIndicator.innerHTML = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐';
        
        reviewElement.appendChild(sentimentIndicator);
    }

    async updateOverallSentiment(reviews) {
        if (reviews.length === 0) return;

        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        
        for (const review of reviews) {
            const sentiment = await this.analyzeReviewSentiment(review.comment || '');
            sentimentCounts[sentiment]++;
        }

        const totalReviews = reviews.length;
        const positivePercentage = (sentimentCounts.positive / totalReviews) * 100;
        const negativePercentage = (sentimentCounts.negative / totalReviews) * 100;

        let overallSentiment = 'neutral';
        if (positivePercentage > 60) {
            overallSentiment = 'positive';
        } else if (negativePercentage > 40) {
            overallSentiment = 'negative';
        }

        const sentimentSummary = document.getElementById('sentimentSummary');
        const overallSentimentEl = document.getElementById('overallSentiment');

        if (sentimentSummary && overallSentimentEl) {
            const icon = overallSentiment === 'positive' ? 'fas fa-smile' : 
                        overallSentiment === 'negative' ? 'fas fa-frown' : 'fas fa-meh';
            const text = overallSentiment === 'positive' ? 'Positive' : 
                        overallSentiment === 'negative' ? 'Negative' : 'Neutral';

            overallSentimentEl.innerHTML = `<i class="${icon}"></i> ${text}`;
            overallSentimentEl.className = `sentiment-indicator ${overallSentiment}`;
            sentimentSummary.style.display = 'flex';
        }
    }
}

// Initialize AI Content Analysis when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiContentAnalysis = new AIContentAnalysis();
}); 