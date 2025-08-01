@echo off
echo 🚀 Starting LibroLink deployment to Render...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git and push to GitHub first.
    echo Run these commands:
    echo   git init
    echo   git add .
    echo   git commit -m "Initial commit"
    echo   git remote add origin YOUR_GITHUB_REPO_URL
    echo   git push -u origin main
    pause
    exit /b 1
)

REM Check if all required files exist
echo 📋 Checking required files...

if not exist "package.json" (
    echo ❌ Missing required file: package.json
    pause
    exit /b 1
)

if not exist "render.yaml" (
    echo ❌ Missing required file: render.yaml
    pause
    exit /b 1
)

if not exist "backend\package.json" (
    echo ❌ Missing required file: backend\package.json
    pause
    exit /b 1
)

if not exist "backend\server.js" (
    echo ❌ Missing required file: backend\server.js
    pause
    exit /b 1
)

echo ✅ All required files found

echo.
echo 📝 Next Steps:
echo 1. Push your code to GitHub:
echo    git add .
echo    git commit -m "Prepare for Render deployment"
echo    git push
echo.
echo 2. Go to https://render.com and create a new Web Service
echo 3. Connect your GitHub repository
echo 4. Render will automatically detect the render.yaml file
echo 5. Add these environment variables in Render dashboard:
echo    - MONGODB_URI: Your MongoDB Atlas connection string
echo    - JWT_SECRET: A secure random string (or let Render generate)
echo    - OPENAI_API_KEY: not-required (AI features work without OpenAI)
echo    - NODE_ENV: production
echo    - PORT: 10000
echo.
echo 6. Deploy and test your application
echo.
echo 📚 For detailed instructions, see RENDER_DEPLOYMENT.md
echo.
echo 🎉 Good luck with your deployment!
pause 