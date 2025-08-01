const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');
const sampleData = require('../database/sampleData.json');
require('dotenv').config();

const connectDB = require('./config/database');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Book.deleteMany({});
        console.log('Cleared existing data');

        // Create sample users
        const users = [];
        for (let i = 1; i <= 20; i++) {
            const user = new User({
                firstName: `User${i}`,
                lastName: `Test${i}`,
                email: `user${i}@example.com`,
                password: 'password123',
                username: `user${i}`,
                accountType: i <= 5 ? 'seller' : (i <= 10 ? 'buyer' : 'both'),
                isActive: true,
                phone: `+1-555-${String(i).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
                bio: `This is user ${i}'s bio`,
                stats: {
                    booksOwned: Math.floor(Math.random() * 50),
                    booksSold: Math.floor(Math.random() * 20),
                    totalSpent: Math.floor(Math.random() * 10000),
                    totalEarned: Math.floor(Math.random() * 5000)
                }
            });
            users.push(await user.save());
        }
        console.log(`Created ${users.length} users`);

        // Create sample books
        const books = [];
        for (let i = 0; i < sampleData.books.length; i++) {
            const bookData = sampleData.books[i];
            const seller = users[Math.floor(Math.random() * 5)]; // First 5 users are sellers
            
            // Fix category mapping
            let category = bookData.category.toLowerCase();
            if (category === "children's books") {
                category = "children";
            }
            
            // Fix condition mapping
            let condition = bookData.condition.toLowerCase().replace(' ', '-');
            if (condition === 'fair') {
                condition = 'acceptable';
            } else if (condition === 'excellent') {
                condition = 'like-new';
            }
            
            const book = new Book({
                title: bookData.title,
                author: bookData.author,
                isbn: bookData.isbn,
                description: bookData.description,
                category: category,
                genre: bookData.genre,
                condition: condition,
                price: bookData.price,
                originalPrice: bookData.originalPrice,
                seller: seller._id,
                sellerName: seller.firstName + ' ' + seller.lastName,
                coverImage: bookData.coverImage,
                status: bookData.status,
                views: bookData.views,
                likes: Math.floor(Math.random() * 50),
                language: bookData.language,
                publisher: bookData.publisher,
                publishedYear: bookData.publicationYear,
                pages: bookData.pageCount,
                tags: bookData.tags,
                location: {
                    city: bookData.location.split(',')[0],
                    state: bookData.location.split(',')[1]?.trim() || 'Unknown',
                    country: 'USA'
                },
                shipping: {
                    free: Math.random() > 0.5,
                    cost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 500),
                    methods: bookData.shippingOptions
                },
                averageRating: bookData.averageRating,
                reviewCount: Math.floor(Math.random() * 20)
            });
            books.push(await book.save());
        }
        console.log(`Created ${books.length} books`);

        // Add some sold books for revenue tracking
        for (let i = 0; i < 10; i++) {
            const book = books[Math.floor(Math.random() * books.length)];
            const buyer = users[Math.floor(Math.random() * users.length)];
            
            book.status = 'sold';
            book.soldTo = buyer._id;
            book.soldDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
            book.soldPrice = book.price;
            await book.save();
        }

        // Add some reviews
        for (let i = 0; i < 30; i++) {
            const book = books[Math.floor(Math.random() * books.length)];
            const reviewer = users[Math.floor(Math.random() * users.length)];
            
            book.reviews.push({
                user: reviewer._id,
                rating: Math.floor(Math.random() * 5) + 1,
                comment: `Great book! Review ${i + 1}`,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
            
            // Recalculate average rating
            const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
            book.averageRating = totalRating / book.reviews.length;
            book.reviewCount = book.reviews.length;
            
            await book.save();
        }

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 