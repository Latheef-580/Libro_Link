const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');
const sampleData = require('../database/sampleData.json');
require('dotenv').config();

const connectDB = require('./config/database');

async function seedOnDeploy() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Check if sample data already exists
        const existingBooks = await Book.countDocuments();
        if (existingBooks > 0) {
            console.log(`Database already has ${existingBooks} books, skipping seeding`);
            process.exit(0);
        }

        console.log('Database is empty, seeding with sample data...');

        // Create a default seller user if it doesn't exist
        let defaultSeller = await User.findOne({ email: 'default-seller@librolink.com' });
        if (!defaultSeller) {
            defaultSeller = new User({
                firstName: 'Default',
                lastName: 'Seller',
                email: 'default-seller@librolink.com',
                password: 'defaultpassword123',
                username: 'defaultseller',
                accountType: 'seller',
                isActive: true,
                phone: '+1-555-000-0000',
                bio: 'Default seller for sample books'
            });
            await defaultSeller.save();
            console.log('Created default seller');
        }

        // Create sample books
        const books = [];
        for (let i = 0; i < sampleData.books.length; i++) {
            const bookData = sampleData.books[i];
            
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
                seller: defaultSeller._id,
                sellerName: defaultSeller.firstName + ' ' + defaultSeller.lastName,
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
        console.log(`Created ${books.length} sample books`);
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedOnDeploy(); 