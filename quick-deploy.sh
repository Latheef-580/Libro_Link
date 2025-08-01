#!/bin/bash

# 🚀 LibroLink Quick Deployment Script
# This script helps you prepare your project for deployment

echo "🚀 LibroLink Deployment Preparation"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if all files are added
echo "📦 Checking git status..."
git status

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🗄️  Setup MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create free account"
echo "   - Create database cluster"
echo "   - Get connection string"
echo ""
echo "2. 📤 Upload to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git remote add origin https://github.com/YOUR_USERNAME/librolink.git"
echo "   git push -u origin main"
echo ""
echo "3. 🌐 Deploy Backend to Render:"
echo "   - Go to https://render.com"
echo "   - Connect GitHub repository"
echo "   - Create Web Service"
echo "   - Set Root Directory: backend"
echo "   - Add environment variables"
echo ""
echo "4. 🎨 Deploy Frontend to Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Connect GitHub repository"
echo "   - Set Base directory: frontend"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Your project is ready for deployment!" 