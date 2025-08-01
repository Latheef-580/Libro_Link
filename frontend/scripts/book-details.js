// book-details.js - Book details page functionality

import { apiFetch } from './utils/api.js';
import { formatUsdToInr, formatPriceRange } from './utils/currency.js';

class BookDetailsManager {
    constructor() {
        this.book = null;
        this.books = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.checkAuthStatus();
        await this.loadBooks();
        this.loadBookFromURL();
        this.setupEventListeners();
        this.updateUI();
    }

    checkAuthStatus() {
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.currentUser = user;
    }

    getUserSpecificKey(key) {
        if (!this.currentUser) return key;
        return `${key}_${this.currentUser.id || this.currentUser.email}`;
    }

    async loadBooks() {
        try {
            // Load books from API
            let sampleDataBooks = [];
            try {
                const response = await fetch('/api/books');
                const data = await response.json();
                sampleDataBooks = Array.isArray(data.books) ? data.books : [];
                console.log('[BookDetails] Loaded API books:', sampleDataBooks.length);
            } catch (e) {
                console.log('[BookDetails] Error loading books from API, trying sample data:', e);
                try {
                    const sampleResponse = await fetch('/api/books/sample');
                    const sampleData = await sampleResponse.json();
                    sampleDataBooks = Array.isArray(sampleData.books) ? sampleData.books : [];
                    console.log('[BookDetails] Loaded books from sample data:', sampleDataBooks.length);
                } catch (sampleError) {
                    console.log('[BookDetails] Sample data route also failed:', sampleError);
                    sampleDataBooks = [];
                }
            }

            // Normalize sampleData books to match expected format
            const normalizedSampleBooks = sampleDataBooks.map(book => ({
                id: book.id || book._id,
                title: book.title,
                author: book.author,
                price: book.price,
                originalPrice: book.originalPrice,
                condition: (book.condition || '').toLowerCase().replace(/\s+/g, '-'),
                category: (book.category || '').toLowerCase(),
                language: (book.language || '').toLowerCase(),
                image: book.coverImage || book.image,
                rating: book.averageRating || 0,
                reviews: book.views || 0,
                seller: book.sellerName || book.seller,
                description: book.description,
                isbn: book.isbn,
                availability: book.status === 'available' ? 'available' : 'out-of-stock',
                dateAdded: new Date('2024-01-15'),
                genre: book.genre,
                pageCount: book.pageCount,
                publisher: book.publisher,
                publicationYear: book.publicationYear,
                tags: book.tags || [],
                location: book.location,
                shippingOptions: book.shippingOptions || [],
                sellerId: book.sellerId,
                samplePdf: book.samplePdf,
                preview: book.preview
            }));

            // Load seller books from localStorage
            const globalBooks = JSON.parse(localStorage.getItem('global_books') || '[]');

            // Add hardcoded books for IDs that might not be in sampleData
            const hardcodedBooks = [
                {
                    id: 9,
                    title: "JavaScript: The Good Parts",
                    author: "Douglas Crockford",
                    price: 1996.99,
                    originalPrice: 2299.99,
                    condition: "fair",
                    category: "textbooks",
                    language: "english",
                    image: "/assets/images/javascript.jpg",
                    rating: 4.2,
                    reviews: 89,
                    seller: "TechBooks2024",
                    description: "Essential JavaScript concepts and best practices for writing maintainable code.",
                    isbn: "978-0-596-51774-8",
                    availability: "available",
                    dateAdded: new Date('2024-01-25'),
                    genre: "Programming",
                    pageCount: 172,
                    publisher: "O'Reilly Media",
                    publicationYear: 2008,
                    tags: ["javascript", "programming", "web development"],
                    location: "San Francisco, CA",
                    shippingOptions: ["standard", "express"],
                    sellerId: 1, // Added for price display logic
                    samplePdf: "/assets/pdf/javascript-good-parts.pdf",
                    preview: "A concise, readable, and thoroughly useful book for JavaScript programmers."
                },
                {
                    id: 10,
                    title: "Dune",
                    author: "Frank Herbert",
                    price: 2499.99,
                    originalPrice: 2999.99,
                    condition: "new",
                    category: "sci-fi",
                    language: "english",
                    image: "/assets/images/dune.jpg",
                    rating: 4.7,
                    reviews: 342,
                    seller: "SciFiWorld",
                    description: "Epic science fiction novel set on the desert planet Arrakis, featuring political intrigue and environmental themes.",
                    isbn: "978-0-441-17271-9",
                    availability: "available",
                    dateAdded: new Date('2024-02-01'),
                    genre: "Science Fiction",
                    pageCount: 688,
                    publisher: "Ace Books",
                    publicationYear: 1965,
                    tags: ["science fiction", "dune", "frank herbert"],
                    location: "Los Angeles, CA",
                    shippingOptions: ["standard", "express"],
                    sellerId: 2, // Added for price display logic
                    samplePdf: "/assets/pdf/dune.pdf",
                    preview: "A masterful blend of political intrigue, environmental themes, and a compelling narrative."
                },
                {
                    id: 11,
                    title: "Pride and Prejudice",
                    author: "Jane Austen",
                    price: 1499.75,
                    originalPrice: 1699.99,
                    condition: "good",
                    category: "romance",
                    language: "english",
                    image: "/assets/images/pride-and-prejudice.jpg",
                    rating: 4.6,
                    reviews: 278,
                    seller: "RomanceReads",
                    description: "Classic romance novel about Elizabeth Bennet and Mr. Darcy, exploring themes of love, marriage, and social class.",
                    isbn: "978-0-14-143951-8",
                    availability: "out-of-stock",
                    dateAdded: new Date('2024-02-05'),
                    genre: "Romance",
                    pageCount: 432,
                    publisher: "Penguin Classics",
                    publicationYear: 1813,
                    tags: ["romance", "classic", "jane austen"],
                    location: "London, UK",
                    shippingOptions: ["standard"],
                    sellerId: 3, // Added for price display logic
                    samplePdf: null, // No sample PDF for this book
                    preview: "A timeless classic of English literature, exploring the complexities of love and social class."
                },
                {
                    id: 12,
                    title: "The Girl with the Dragon Tattoo",
                    author: "Stieg Larsson",
                    price: 1699.99,
                    originalPrice: 1999.99,
                    condition: "like-new",
                    category: "mystery",
                    language: "english",
                    image: "/assets/images/the-girl-with-the-dragon-tattoo.jpg",
                    rating: 4.4,
                    reviews: 187,
                    seller: "MysteryMania",
                    description: "A gripping mystery thriller about a journalist and a computer hacker investigating a 40-year-old disappearance.",
                    isbn: "978-0-307-47443-8",
                    availability: "available",
                    dateAdded: new Date('2024-02-10'),
                    genre: "Mystery/Thriller",
                    pageCount: 672,
                    publisher: "Vintage Crime/Black Lizard",
                    publicationYear: 2005,
                    tags: ["mystery", "thriller", "crime"],
                    location: "Stockholm, Sweden",
                    shippingOptions: ["standard", "express"],
                    sellerId: 4, // Added for price display logic
                    samplePdf: "/assets/pdf/the-girl-with-the-dragon-tattoo.pdf",
                    preview: "A thrilling and atmospheric mystery novel, perfect for fans of psychological suspense."
                }
            ];

            // Combine all sources and deduplicate by id
            const allBooks = [...normalizedSampleBooks, ...globalBooks, ...hardcodedBooks];
            const seenIds = new Set();
            const uniqueBooks = allBooks.filter(book => {
                if (seenIds.has(String(book.id))) return false;
                seenIds.add(String(book.id));
                return true;
            });

            // Sort by id
            uniqueBooks.sort((a, b) => Number(a.id) - Number(b.id));
            this.books = uniqueBooks;
            
            console.log('[BookDetails] Total books loaded:', this.books.length);
            console.log('[BookDetails] Book IDs:', this.books.map(b => b.id));
        } catch (error) {
            console.error('[BookDetails] Error loading books:', error);
            this.books = [];
        }
    }

    loadBookFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        
        console.log('[BookDetails] Loading book with ID:', bookId);
        console.log('[BookDetails] Available books:', this.books.length);
        console.log('[BookDetails] Book IDs:', this.books.map(b => b.id));
        
        if (bookId) {
            this.book = this.books.find(book => String(book.id || book._id) === String(bookId));
            console.log('[BookDetails] Found book:', this.book);
            
            if (this.book) {
                this.displayBookDetails();
            } else {
                console.log('[BookDetails] Book not found, showing error page');
                this.showBookNotFound();
            }
        } else {
            console.log('[BookDetails] No book ID provided');
            this.showBookNotFound();
        }
    }

    displayBookDetails() {
        if (!this.book) return;

        console.log('[BookDetails] Displaying book details:', this.book);

        // Update page title
        document.title = `${this.book.title} | LibroLink`;

        // Update book image
        const bookCover = document.getElementById('book-cover');
        if (bookCover) {
            bookCover.src = this.book.image || '/assets/images/placeholder-book.png';
            bookCover.alt = this.book.title;
        }

        // Update book title
        const bookTitle = document.getElementById('book-title');
        if (bookTitle) {
            bookTitle.textContent = this.book.title;
        }

        // Update book author
        const bookAuthor = document.getElementById('book-author');
        if (bookAuthor) {
            bookAuthor.textContent = `by ${this.book.author}`;
        }

        // Update book meta information
        const bookCategory = document.getElementById('book-category');
        if (bookCategory) {
            bookCategory.textContent = this.formatCategory(this.book.category);
        }

        const bookCondition = document.getElementById('book-condition');
        if (bookCondition) {
            bookCondition.textContent = this.formatCondition(this.book.condition);
        }

        // Price display logic
        const bookPrice = document.getElementById('book-price');
        if (bookPrice && this.book) {
            let priceHtml;
            if (this.book.sellerId) {
                if (this.book.originalPrice && this.book.originalPrice > this.book.price) {
                    const discountPercent = Math.round(((this.book.originalPrice - this.book.price) / this.book.originalPrice) * 100);
                    priceHtml = `
                        <span class="current-price">₹${this.book.price.toFixed(2)}</span>
                        <span class="original-price">₹${this.book.originalPrice.toFixed(2)}</span>
                        <span class="discount-badge">-${discountPercent}%</span>
                    `;
                } else {
                    priceHtml = `₹${this.book.price.toFixed(2)}`;
                }
            } else {
                priceHtml = formatPriceRange(this.book.price, this.book.originalPrice);
            }
            bookPrice.innerHTML = priceHtml;
        }

        const bookSeller = document.getElementById('book-seller');
        if (bookSeller) {
            bookSeller.textContent = this.book.seller;
        }

        // Update rating
        const ratingStars = document.getElementById('book-rating-stars');
        const ratingText = document.getElementById('book-rating-text');
        if (ratingStars && ratingText) {
            ratingStars.innerHTML = this.createStarRating(this.book.rating);
            ratingText.textContent = `${this.book.rating.toFixed(1)} (${this.book.reviews} reviews)`;
        }

        // Update description with enhanced information
        const bookDescription = document.getElementById('book-description-text');
        if (bookDescription) {
            let description = this.book.description || 'No description available.';
            
            // Add additional details if available
            const additionalInfo = [];
            if (this.book.isbn) {
                additionalInfo.push(`<strong>ISBN:</strong> ${this.book.isbn}`);
            }
            if (this.book.pageCount) {
                additionalInfo.push(`<strong>Pages:</strong> ${this.book.pageCount}`);
            }
            if (this.book.publisher) {
                additionalInfo.push(`<strong>Publisher:</strong> ${this.book.publisher}`);
            }
            if (this.book.publicationYear) {
                additionalInfo.push(`<strong>Published:</strong> ${this.book.publicationYear}`);
            }
            if (this.book.location) {
                additionalInfo.push(`<strong>Location:</strong> ${this.book.location}`);
            }
            if (this.book.shippingOptions && this.book.shippingOptions.length > 0) {
                additionalInfo.push(`<strong>Shipping:</strong> ${this.book.shippingOptions.join(', ')}`);
            }
            if (this.book.tags && this.book.tags.length > 0) {
                additionalInfo.push(`<strong>Tags:</strong> ${this.book.tags.join(', ')}`);
            }
            
            if (additionalInfo.length > 0) {
                description += '<br><br><strong>Additional Information:</strong><br>' + additionalInfo.join('<br>');
            }
            
            bookDescription.innerHTML = description;
        }

        // Update availability status
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            if (this.book.availability === 'out-of-stock') {
                addToCartBtn.textContent = 'Out of Stock';
                addToCartBtn.disabled = true;
                addToCartBtn.classList.add('disabled');
            } else {
                addToCartBtn.textContent = 'Add to Cart';
                addToCartBtn.disabled = false;
                addToCartBtn.classList.remove('disabled');
            }
        }

        // Show/hide sample PDF button
        const readSamplePdfBtn = document.getElementById('read-sample-pdf');
        if (readSamplePdfBtn) {
            if (this.book.samplePdf) {
                readSamplePdfBtn.style.display = 'inline-block';
            } else {
                readSamplePdfBtn.style.display = 'none';
            }
        }

        console.log('[BookDetails] Book details displayed successfully');
    }

    showBookNotFound() {
        const container = document.querySelector('.book-details-content');
        if (container) {
            container.innerHTML = `
                <div class="book-not-found">
                    <i class="fas fa-book-open"></i>
                    <h2>Book Not Found</h2>
                    <p>The book you're looking for doesn't exist or has been removed.</p>
                    <a href="/books.html" class="btn btn-primary">Browse All Books</a>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Add to wishlist button
        const addToWishlistBtn = document.getElementById('add-to-wishlist');
        if (addToWishlistBtn) {
            addToWishlistBtn.addEventListener('click', () => this.addToWishlist());
        }

        // Add to cart button
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // Read sample PDF button
        const readSamplePdfBtn = document.getElementById('read-sample-pdf');
        if (readSamplePdfBtn) {
            readSamplePdfBtn.addEventListener('click', () => this.showSamplePdf());
        }

        // Review form
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.handleReviewSubmit(e));
        }
    }

    addToWishlist() {
        if (!this.book) return;

        // Check if user is logged in
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // Add to wishlist with user-specific key
        const wishlistKey = this.getUserSpecificKey('wishlist');
        let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        const existingIndex = wishlist.findIndex(item => item.id === this.book.id);
        
        if (existingIndex > -1) {
            wishlist.splice(existingIndex, 1);
            if (window.showNotification) {
                window.showNotification(`"${this.book.title}" removed from wishlist`, 'info');
            }
        } else {
            wishlist.push({
                id: this.book.id,
                title: this.book.title,
                author: this.book.author,
                price: this.book.price,
                image: this.book.image || '/assets/images/placeholder-book.jpg',
                dateAdded: new Date().toISOString()
            });
            if (window.showNotification) {
                window.showNotification(`"${this.book.title}" added to wishlist`, 'success');
            }
        }
        
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        this.updateWishlistButton();
    }

    addToCart() {
        if (!this.book) return;

        // Check if user is logged in
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        // Add to cart with user-specific key
        const cartKey = this.getUserSpecificKey('cart');
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const existingIndex = cart.findIndex(item => item.id === this.book.id);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
            if (window.showNotification) {
                window.showNotification(`Quantity updated for "${this.book.title}"`, 'info');
            }
        } else {
            cart.push({
                id: this.book.id,
                title: this.book.title,
                author: this.book.author,
                price: this.book.price,
                image: this.book.image || '/assets/images/placeholder-book.jpg',
                seller: this.book.seller,
                quantity: 1,
                dateAdded: new Date().toISOString()
            });
            if (window.showNotification) {
                window.showNotification(`"${this.book.title}" added to cart`, 'success');
            }
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cart));
        this.updateCartCount();
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        
        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            if (window.showNotification) {
                window.showNotification('Please log in to leave a review', 'error');
            }
            return;
        }

        const rating = document.getElementById('rating').value;
        const comment = document.getElementById('comment').value;

        if (!comment.trim()) {
            if (window.showNotification) {
                window.showNotification('Please enter a comment for your review', 'error');
            }
            return;
        }

        // Add review to the book
        if (!this.book.reviews) {
            this.book.reviews = [];
        }

        const newReview = {
            user: currentUser.name || currentUser.email,
            rating: parseInt(rating),
            comment: comment.trim(),
            date: new Date().toISOString()
        };

        this.book.reviews.push(newReview);
        
        // Update average rating
        const totalRating = this.book.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.book.rating = totalRating / this.book.reviews.length;

        // Update the display
        this.displayBookDetails();
        
        // Reset form
        e.target.reset();
        
        // Analyze sentiment for the new review
        if (window.aiContentAnalysis) {
            const reviewElement = document.querySelector('.review-item:last-child');
            if (reviewElement) {
                await window.aiContentAnalysis.updateReviewSentiment(reviewElement, comment);
            }
            
            // Update overall sentiment
            await window.aiContentAnalysis.updateOverallSentiment(this.book.reviews);
        }

        if (window.showNotification) {
            window.showNotification('Review submitted successfully!', 'success');
        }
    }

    updateWishlistButton() {
        if (!this.book) return;

        const addToWishlistBtn = document.getElementById('add-to-wishlist');
        if (!addToWishlistBtn) return;

        if (!this.currentUser) {
            addToWishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Wishlist';
            addToWishlistBtn.classList.remove('active');
            return;
        }

        // Check if book is in wishlist with user-specific key
        const wishlistKey = this.getUserSpecificKey('wishlist');
        const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        const isInWishlist = wishlist.some(item => item.id === this.book.id);

        if (isInWishlist) {
            addToWishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
            addToWishlistBtn.classList.add('active');
        } else {
            addToWishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Wishlist';
            addToWishlistBtn.classList.remove('active');
        }
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            if (this.currentUser) {
                const cartKey = this.getUserSpecificKey('cart');
                const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                cartCount.textContent = totalItems;
            } else {
                cartCount.textContent = '0';
            }
        }
    }

    showLoginPrompt() {
        if (window.showNotification) {
            window.showNotification('Please log in to continue', 'info');
        }
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    }

    updateUI() {
        this.updateWishlistButton();
        this.updateCartCount();
    }

    showSamplePdf() {
        if (this.book && this.book.samplePdf) {
            showSamplePdfModal(this.book.samplePdf);
        } else {
            this.showNotification('Sample PDF is not available for this book.', 'info');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Helper methods
    createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }

    formatCondition(condition) {
        return condition.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}

// Add modal HTML to the page if not present
function ensureSamplePdfModal() {
    if (!document.getElementById('samplePdfModal')) {
        const modal = document.createElement('div');
        modal.id = 'samplePdfModal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="sample-pdf-modal-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;">
                <div class="sample-pdf-modal-content" style="background:white;border-radius:12px;max-width:90vw;max-height:90vh;position:relative;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                    <button id="closeSamplePdfModal" style="position:absolute;top:12px;right:12px;font-size:1.5rem;background:none;border:none;cursor:pointer;z-index:2;">&larr; Back</button>
                    <div id="samplePdfViewer" style="width:70vw;height:80vh;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeSamplePdfModal').onclick = () => {
            modal.style.display = 'none';
            document.getElementById('samplePdfViewer').innerHTML = '';
        };
        modal.onclick = e => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.getElementById('samplePdfViewer').innerHTML = '';
            }
        };
    }
}

// Show the sample PDF modal
function showSamplePdfModal(pdfDataUrl) {
    ensureSamplePdfModal();
    const modal = document.getElementById('samplePdfModal');
    const viewer = document.getElementById('samplePdfViewer');
    viewer.innerHTML = `<embed src="${pdfDataUrl}" type="application/pdf" width="100%" height="100%" style="border-radius:8px;">`;
    modal.style.display = 'flex';
}

// Patch displayBookDetails to always show the button
const origDisplayBookDetails = BookDetailsManager.prototype.displayBookDetails;
BookDetailsManager.prototype.displayBookDetails = function() {
    origDisplayBookDetails.call(this);
    // --- Price display logic (already present) ---
    // --- Preview text ---
    const previewSection = document.getElementById('book-preview-text');
    if (previewSection) {
        if (this.book && this.book.preview) {
            previewSection.innerHTML = `<strong>Preview:</strong><br>${this.book.preview}`;
        } else {
            previewSection.innerHTML = `<em>No preview text is available.</em>`;
        }
        previewSection.style.display = 'block';
    }
    // --- Read Sample button ---
    let btn = document.getElementById('readSampleBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'readSampleBtn';
        btn.className = 'btn btn-outline';
        btn.textContent = 'Read Sample';
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn && addToCartBtn.parentNode) {
            addToCartBtn.parentNode.insertBefore(btn, addToCartBtn.nextSibling);
        } else {
            document.body.appendChild(btn);
        }
    }
    btn.onclick = () => {
        ensureSamplePdfModal();
        const modal = document.getElementById('samplePdfModal');
        const viewer = document.getElementById('samplePdfViewer');
        if (this.book && this.book.samplePdf) {
            viewer.innerHTML = `<embed id='samplePdfEmbed' src="${this.book.samplePdf}" type="application/pdf" width="100%" height="100%" style="border-radius:8px;">`;
            // Fallback if PDF fails to load
            setTimeout(() => {
                const embed = document.getElementById('samplePdfEmbed');
                if (embed && (!embed.contentDocument && !embed.getSVGDocument && embed.clientHeight === 0)) {
                    viewer.innerHTML = `<div style='display:flex;align-items:center;justify-content:center;height:100%;font-size:1.2rem;color:#888;'>Sample PDF could not be loaded. Please check the file path or try again later.</div>`;
                }
            }, 2000);
        } else {
            viewer.innerHTML = `<div style='display:flex;align-items:center;justify-content:center;height:100%;font-size:1.2rem;color:#888;'>Sample PDF is not available for this book.</div>`;
        }
        modal.style.display = 'flex';
    };
    btn.style.display = 'inline-block';
};

// Initialize the book details manager
document.addEventListener('DOMContentLoaded', () => {
    window.bookDetailsManager = new BookDetailsManager();
});

// Debug function to test book details
window.testBookDetails = function(bookId) {
    console.log('[Debug] Testing book details for ID:', bookId);
    if (window.bookDetailsManager && window.bookDetailsManager.books) {
        const book = window.bookDetailsManager.books.find(b => String(b.id) === String(bookId));
        console.log('[Debug] Found book:', book);
        
        if (book) {
            console.log('[Debug] Book details:', {
                title: book.title,
                author: book.author,
                price: book.price,
                condition: book.condition,
                category: book.category,
                description: book.description,
                isbn: book.isbn,
                pageCount: book.pageCount,
                publisher: book.publisher,
                publicationYear: book.publicationYear,
                tags: book.tags,
                location: book.location,
                shippingOptions: book.shippingOptions
            });
        } else {
            console.log('[Debug] Book not found in bookDetailsManager');
        }
    } else {
        console.log('[Debug] BookDetailsManager not available');
    }
}; 