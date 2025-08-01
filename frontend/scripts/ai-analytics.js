// AI Analytics for LibroLink Profile
// Handles user analytics and AI insights

class AIAnalytics {
    constructor() {
        this.analyticsData = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAnalytics();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshAnalyticsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalytics();
            });
        }
    }

    async loadAnalytics() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showMockData();
                return;
            }

            const response = await fetch('/api/ai/analytics/user-behavior', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.analyticsData = data.analytics;
                this.displayAnalytics();
            } else {
                this.showMockData();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showMockData();
        }
    }

    displayAnalytics() {
        if (!this.analyticsData) return;

        // Display main metrics
        this.updateMetric('engagementScore', this.analyticsData.engagementScore, '%');
        this.updateMetric('churnRisk', this.analyticsData.churnRisk, '%');
        this.updateMetric('lifetimeValue', this.analyticsData.lifetimeValue, '₹');
        this.updateMetric('sessionCount', this.analyticsData.sessionCount, '');

        // Display behavior stats
        if (this.analyticsData.behavior) {
            this.updateBehaviorMetric('booksViewed', this.analyticsData.behavior.viewCount);
            this.updateBehaviorMetric('booksPurchased', this.analyticsData.behavior.purchaseCount);
            this.updateBehaviorMetric('wishlistItems', this.analyticsData.behavior.wishlistCount);
            this.updateBehaviorMetric('reviewsGiven', this.analyticsData.behavior.ratingCount);
        }

        // Load recommendations preview
        this.loadRecommendationsPreview();
    }

    showMockData() {
        // Show realistic mock data for demonstration
        const mockData = {
            engagementScore: 85,
            churnRisk: 15,
            lifetimeValue: 2500,
            sessionCount: 12,
            behavior: {
                viewCount: 45,
                purchaseCount: 8,
                wishlistCount: 15,
                ratingCount: 6
            }
        };

        this.analyticsData = mockData;
        this.displayAnalytics();
    }

    updateMetric(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'number') {
                element.textContent = value + suffix;
            } else {
                element.textContent = value || '--';
            }
        }
    }

    updateBehaviorMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '0';
        }
    }

    async loadRecommendationsPreview() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showMockRecommendations();
                return;
            }

            const response = await fetch('/api/ai/recommendations?type=hybrid&limit=3', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success && data.recommendations.length > 0) {
                this.displayRecommendationsPreview(data.recommendations);
            } else {
                this.showMockRecommendations();
            }
        } catch (error) {
            console.error('Error loading recommendations preview:', error);
            this.showMockRecommendations();
        }
    }

    displayRecommendationsPreview(recommendations) {
        const container = document.getElementById('recommendationsPreview');
        if (!container) return;

        const recommendationsHtml = recommendations.map(book => {
            const imageUrl = book.coverImage || book.images?.[0]?.url || '/assets/images/placeholder-book.jpg';
            
            return `
                <div class="recommendation-preview-item">
                    <img src="${imageUrl}" alt="${book.title}" class="recommendation-preview-image">
                    <div class="recommendation-preview-info">
                        <div class="recommendation-preview-title">${book.title}</div>
                        <div class="recommendation-preview-author">by ${book.author}</div>
                        <div class="recommendation-preview-price">₹${book.price}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="recommendations-preview-grid">
                ${recommendationsHtml}
            </div>
            <div class="recommendations-preview-footer">
                <a href="/books" class="btn btn-sm btn-outline">View All Recommendations</a>
            </div>
        `;
    }

    showMockRecommendations() {
        const container = document.getElementById('recommendationsPreview');
        if (!container) return;

        const mockRecommendations = [
            {
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
                price: 450,
                coverImage: '/assets/images/great-gatsby.jpg'
            },
            {
                title: '1984',
                author: 'George Orwell',
                price: 380,
                coverImage: '/assets/images/1984.jpg'
            },
            {
                title: 'To Kill a Mockingbird',
                author: 'Harper Lee',
                price: 520,
                coverImage: '/assets/images/mockingbird.jpg'
            }
        ];

        this.displayRecommendationsPreview(mockRecommendations);
    }

    // Public method to refresh analytics
    refreshAnalytics() {
        this.loadAnalytics();
    }
}

// Initialize AI Analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiAnalytics = new AIAnalytics();
}); 