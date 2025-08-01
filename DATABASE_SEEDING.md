# Database Seeding Guide

This guide explains how to populate your LibroLink database with sample data.

## Problem

When deploying to Render.com or other cloud platforms, the database starts empty. This means the books page will only show books that are newly added by sellers, but won't display the 16 sample books from `sampleData.json`.

## Solutions

### 1. Automatic Seeding (Recommended)

The application now automatically seeds the database when it starts up in production mode if the database is empty. This happens automatically when you deploy to Render.com.

### 2. Manual Seeding via Admin Page

You can manually trigger the seeding process using the admin page:

1. Visit your deployed website
2. Go to: `https://your-domain.com/admin-seed`
3. Click the "Seed Database" button
4. Wait for the process to complete

### 3. Manual Seeding via API

You can also trigger seeding via the API endpoint:

```bash
curl -X POST https://your-domain.com/api/books/seed
```

### 4. Command Line Seeding

If you have access to the server, you can run:

```bash
# Navigate to backend directory
cd backend

# Run the seeding script
npm run seed
```

## What Gets Seeded

The seeding process will create:

1. **Default Seller Account**: A default seller user with email `default-seller@librolink.com`
2. **16 Sample Books**: All books from `database/sampleData.json` including:
   - The Great Gatsby
   - To Kill a Mockingbird
   - Introduction to Algorithms
   - The Very Hungry Caterpillar
   - Sapiens: A Brief History of Humankind
   - Calculus: Early Transcendentals
   - Harry Potter and the Philosopher's Stone
   - Where the Crawdads Sing
   - JavaScript: The Good Parts
   - Dune
   - Pride and Prejudice
   - The Girl with the Dragon Tattoo
   - 1984
   - Clean Code
   - The Catcher in the Rye
   - Design Patterns

## Verification

After seeding, you can verify the data was added by:

1. Visiting the books page: `https://your-domain.com/books`
2. You should see all 16 sample books displayed
3. Or check the admin page: `https://your-domain.com/admin-seed`

## Troubleshooting

### Database Still Empty After Seeding

1. Check the server logs for any errors during seeding
2. Verify your MongoDB connection string is correct
3. Try the manual seeding via the admin page
4. Check if the seeding process was interrupted

### Books Not Showing on Frontend

1. Clear your browser cache
2. Check the browser console for any JavaScript errors
3. Verify the API endpoint `/api/books` is returning data
4. Check if there are any CORS issues

### Permission Issues

If you get permission errors when trying to seed:

1. Make sure your MongoDB user has write permissions
2. Check if your database connection string includes the correct credentials
3. Verify the database exists and is accessible

## Files Modified

The following files were modified to implement automatic seeding:

- `backend/controllers/bookController.js` - Added automatic seeding logic
- `backend/routes/books.js` - Added manual seeding endpoint
- `backend/server.js` - Added auto-seeding on startup
- `backend/seed-on-deploy.js` - New standalone seeding script
- `frontend/admin-seed.html` - New admin interface for seeding
- `backend/package.json` - Added seeding scripts

## Environment Variables

Make sure these environment variables are set in your deployment:

- `MONGODB_URI` - Your MongoDB connection string
- `NODE_ENV` - Set to "production" for auto-seeding to work 