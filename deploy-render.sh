#!/bin/bash

# LibroLink Render Deployment Script
echo "🚀 Starting LibroLink deployment to Render..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git and push to GitHub first."
    echo "Run these commands:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git remote add origin YOUR_GITHUB_REPO_URL"
    echo "  git push -u origin main"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=("package.json" "render.yaml" "backend/package.json" "backend/server.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Check if environment variables are set
echo "🔧 Checking environment variables..."

if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI not set. You'll need to set this in Render dashboard."
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  JWT_SECRET not set. Render will generate this automatically."
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set. You'll need to set this in Render dashboard."
fi

echo ""
echo "📝 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push"
echo ""
echo "2. Go to https://render.com and create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect the render.yaml file"
echo "5. Add these environment variables in Render dashboard:"
echo "   - MONGODB_URI: Your MongoDB Atlas connection string"
echo "   - JWT_SECRET: A secure random string (or let Render generate)"
echo "   - OPENAI_API_KEY: Your OpenAI API key"
echo "   - NODE_ENV: production"
echo "   - PORT: 10000"
echo ""
echo "6. Deploy and test your application"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 Good luck with your deployment!" 