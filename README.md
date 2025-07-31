# LibroLink

LibroLink is a full-stack web application for buying, selling, and managing books. It features user authentication, admin management, book listings, reviews, wishlists, and more. Built with Node.js, Express, MongoDB, and a modern HTML/CSS/JS frontend.

## 🚀 Features
- User registration, login, and JWT authentication
- Book CRUD (create, read, update, delete)
- Wishlist/favorites and reading history
- Book reviews and ratings
- Admin dashboard for user/book management and analytics
- Secure password hashing and validation
- Responsive frontend with modern UI

## 🛠 Tech Stack
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** JWT
- **Other:** Helmet, CORS, Rate Limiting, Multer (for uploads)

## ⚙️ Setup Instructions

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd LibroLink
```

### 2. Install dependencies
```sh
cd backend
npm install
```

### 3. Create a `.env` file in the backend directory
```
MONGODB_URI=mongodb://localhost:27017/librolink
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=development
```

### 4. Start MongoDB
Ensure MongoDB is running locally. You can use Docker or your local MongoDB installation.

### 5. Start the backend server
```sh
npm start
# or for development
npm run dev
```

### 6. Access the app
- Frontend: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📦 Folder Structure
```
LibroLink/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    server.js
    package.json
  frontend/
    assets/
    scripts/
    styles/
    index.html
    books.html
    login.html
    register.html
    profile.html
    seller-dashboard.html
    wishlist.html
    404.html
  admin/
    admin.html
    scripts/
    styles/
  database/
    sampleData.json
  README.md
```

## 📚 API Endpoints Summary

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `POST /api/auth/logout` — Logout
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password
- `GET /api/auth/verify/:token` — Verify email

### Books
- `GET /api/books` — List/search books
- `GET /api/books/:id` — Get book by ID
- `POST /api/books` — Create book (seller only)
- `PUT /api/books/:id` — Update book (seller only)
- `DELETE /api/books/:id` — Delete book (seller only)
- `POST /api/books/:id/reviews` — Add review
- `GET /api/books/:id/recommendations` — Get recommendations

### Users
- `GET /api/users/profile` — Get profile
- `PUT /api/users/profile` — Update profile
- `PUT /api/users/preferences` — Update preferences
- `PUT /api/users/change-password` — Change password
- `DELETE /api/users/account` — Delete account
- `GET /api/users/favorites` — Get wishlist
- `POST /api/users/wishlist` — Add to wishlist
- `DELETE /api/users/wishlist/:id` — Remove from wishlist
- `GET /api/users/reading-history` — Get reading history
- `POST /api/users/reading-history` — Add to reading history

### Admin
- `GET /api/admin/dashboard/stats` — Dashboard stats
- `GET /api/admin/users` — List users
- `POST /api/admin/users` — Create user
- `PUT /api/admin/users/:userId` — Update user
- `DELETE /api/admin/users/:userId` — Delete user
- `GET /api/admin/books` — List books
- `POST /api/admin/books` — Create book
- `PUT /api/admin/books/:bookId` — Update book
- `DELETE /api/admin/books/:bookId` — Delete book
- `GET /api/admin/analytics` — Analytics

## 👥 Credits
- Developed by Shaik Abdul Latheef(shaikabdullatheef580@gmail.com)
- Inspired by modern book marketplaces

## 📄 License
MIT License 