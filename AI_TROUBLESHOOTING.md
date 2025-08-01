# AI Features Troubleshooting Guide

## 🚨 AI Features Not Working on Live URL

### **Quick Fixes:**

1. **Check if AI endpoints are accessible:**
   ```
   https://your-app.onrender.com/api/ai/status
   https://your-app.onrender.com/api/ai/test
   ```

2. **Test AI recommendations:**
   ```
   https://your-app.onrender.com/api/ai/recommendations?type=hybrid&limit=3
   ```

3. **Test AI chatbot:**
   ```
   POST https://your-app.onrender.com/api/ai/chatbot/message
   Body: {"message": "Hello"}
   ```

### **Common Issues & Solutions:**

#### **Issue 1: 404 Not Found**
- **Cause**: AI routes not properly registered
- **Solution**: Check if `/api/ai` route is registered in `server.js`

#### **Issue 2: 500 Internal Server Error**
- **Cause**: Import errors or missing dependencies
- **Solution**: Check server logs in Render dashboard

#### **Issue 3: CORS Errors**
- **Cause**: Frontend can't access AI endpoints
- **Solution**: Update CORS configuration in `server.js`

#### **Issue 4: Database Connection Issues**
- **Cause**: MongoDB not connected
- **Solution**: Check `MONGODB_URI` environment variable

### **Testing Steps:**

1. **Local Testing:**
   ```bash
   # Start your server
   npm start
   
   # Test AI endpoints
   curl http://localhost:3001/api/ai/status
   curl http://localhost:3001/api/ai/recommendations
   ```

2. **Production Testing:**
   ```bash
   # Test your live URL
   curl https://your-app.onrender.com/api/ai/status
   curl https://your-app.onrender.com/api/ai/recommendations
   ```

3. **Browser Testing:**
   - Open browser console
   - Visit your live URL
   - Check for JavaScript errors
   - Test AI features manually

### **Debug Information:**

#### **AI Endpoints Available:**
- `GET /api/ai/status` - Check AI system status
- `GET /api/ai/test` - Test AI functionality
- `GET /api/ai/recommendations` - Get AI recommendations
- `GET /api/ai/search/autocomplete` - Get search suggestions
- `POST /api/ai/chatbot/message` - Send chatbot message
- `POST /api/ai/content/analyze` - Analyze content

#### **Expected Responses:**

**AI Status:**
```json
{
  "success": true,
  "status": "operational",
  "features": {
    "recommendations": "available",
    "chatbot": "available",
    "search": "available",
    "contentAnalysis": "available"
  }
}
```

**AI Recommendations:**
```json
{
  "success": true,
  "recommendations": [
    {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "aiScore": 95,
      "reason": "Based on your reading preferences..."
    }
  ]
}
```

### **Environment Variables Check:**

Make sure these are set in Render:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - Set to "not-required"
- `NODE_ENV` - Set to "production"
- `PORT` - Set to "10000"

### **Server Logs:**

Check Render dashboard logs for:
- Database connection errors
- Import/module errors
- Route registration errors
- CORS errors

### **Frontend Issues:**

1. **AI Features not loading:**
   - Check browser console for errors
   - Verify API calls are being made
   - Check network tab for failed requests

2. **AI Chatbot not responding:**
   - Check if chatbot modal is created
   - Verify event listeners are attached
   - Check API response format

3. **AI Search not working:**
   - Check search input field
   - Verify autocomplete suggestions
   - Check API endpoint responses

### **Quick Test Commands:**

```bash
# Test AI status
curl -X GET "https://your-app.onrender.com/api/ai/status"

# Test AI recommendations
curl -X GET "https://your-app.onrender.com/api/ai/recommendations?type=hybrid&limit=3"

# Test AI chatbot
curl -X POST "https://your-app.onrender.com/api/ai/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Test AI search
curl -X GET "https://your-app.onrender.com/api/ai/search/autocomplete?query=great&limit=5"
```

### **If Still Not Working:**

1. **Check Render Build Logs:**
   - Go to Render dashboard
   - Check build logs for errors
   - Verify all dependencies installed

2. **Check Server Logs:**
   - Look for runtime errors
   - Check database connection status
   - Verify route registration

3. **Test Locally:**
   - Clone repository fresh
   - Install dependencies
   - Test locally first
   - Compare with production

4. **Contact Support:**
   - Check Render documentation
   - Review error logs
   - Test with minimal setup

### **Success Indicators:**

✅ AI status endpoint returns operational status
✅ AI recommendations show books with scores
✅ AI chatbot responds to messages
✅ AI search provides suggestions
✅ No console errors in browser
✅ All API calls return 200 status codes

### **Emergency Fallback:**

If AI features still don't work, the app will fallback to:
- Sample data for books
- Basic search functionality
- Manual book recommendations
- Static content display

**The core book marketplace functionality will still work even if AI features fail!** 