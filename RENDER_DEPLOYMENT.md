# LibroLink Deployment Guide for Render

## Prerequisites

1. **GitHub Repository**: Ensure your project is pushed to GitHub
2. **MongoDB Atlas Account**: For cloud database (recommended)
3. **Render Account**: Sign up at [render.com](https://render.com)

## Step 1: Set Up MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Push your code to GitHub** (if not already done)
2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**:
   - In your Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/librolink?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=not-required
NODE_ENV=production
PORT=10000
```

### Option B: Manual Deployment

1. **Create New Web Service**:
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `librolink`
   - **Environment**: `Node`
   - **Build Command**: `npm run install-deps`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Add Environment Variables** (same as above)

## Step 3: Database Setup

### Option A: MongoDB Atlas (Recommended)

1. Use your MongoDB Atlas connection string
2. The database will be created automatically when the app first connects

### Option B: Render PostgreSQL (Alternative)

If you prefer PostgreSQL:
1. Create a PostgreSQL service in Render
2. Update your connection string
3. Modify the database configuration

## Step 4: Environment Variables

Add these to your Render service:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `JWT_SECRET` | `your-secret-key` | Secret for JWT tokens |
| `OPENAI_API_KEY` | `not-required` | Not required - AI features use mock responses |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Port for the application |

## Step 5: Verify Deployment

1. **Check Build Logs**: Ensure the build completes successfully
2. **Test Endpoints**: Visit your Render URL and test:
   - `https://your-app.onrender.com/` (should show homepage)
   - `https://your-app.onrender.com/api/books` (should return books)
   - `https://your-app.onrender.com/books.html` (should show books page)

## Step 6: Custom Domain (Optional)

1. In your Render service settings
2. Go to "Settings" → "Custom Domains"
3. Add your domain and configure DNS

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if all dependencies are in `backend/package.json`
   - Ensure Node.js version is compatible

2. **Database Connection Fails**:
   - Verify MongoDB URI is correct
   - Check if IP is whitelisted in MongoDB Atlas
   - Ensure database user has correct permissions

3. **Static Files Not Loading**:
   - Check if frontend files are in the correct location
   - Verify static file serving configuration

4. **CORS Errors**:
   - Update CORS configuration in `server.js`
   - Add your domain to allowed origins

### Debug Commands:

```bash
# Check logs in Render dashboard
# Or use Render CLI if available

# Test locally with production settings
NODE_ENV=production npm start
```

## File Structure for Render

```
librolink/
├── package.json          # Root package.json for Render
├── render.yaml           # Render configuration
├── backend/
│   ├── package.json      # Backend dependencies
│   ├── server.js         # Main server file
│   └── ...               # Other backend files
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── books.html        # Books page
│   └── ...               # Other frontend files
└── database/
    └── sampleData.json   # Sample data
```

## Performance Optimization

1. **Enable Caching**: Add caching headers for static files
2. **Compression**: Enable gzip compression
3. **CDN**: Consider using a CDN for static assets
4. **Database Indexing**: Add indexes to MongoDB collections

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure CORS properly for production
3. **Helmet**: Security headers are already configured
4. **Rate Limiting**: Consider adding rate limiting for APIs
5. **Input Validation**: Ensure all inputs are validated

## Monitoring

1. **Render Logs**: Monitor application logs in Render dashboard
2. **MongoDB Atlas**: Monitor database performance
3. **Uptime Monitoring**: Set up uptime monitoring
4. **Error Tracking**: Consider adding error tracking service

## Cost Optimization

1. **Free Tier**: Render free tier is sufficient for development
2. **Auto-sleep**: Free tier services sleep after inactivity
3. **Database**: MongoDB Atlas has a generous free tier
4. **Scaling**: Upgrade only when needed

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **GitHub Issues**: For project-specific issues 