@echo off
REM College Canteen QR Backend Setup Script for Windows
REM This script helps set up the development environment

echo 🚀 Setting up College Canteen QR Backend...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    echo ⚠️  Please update the .env file with your actual configuration values
) else (
    echo ✅ .env file already exists
)

REM Create logs directory
if not exist logs mkdir logs
echo ✅ Created logs directory

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Update your .env file with actual configuration values:
echo    - Supabase credentials
echo    - Google OAuth client ID
echo    - Razorpay test keys
echo    - Email configuration
echo.
echo 2. Set up your Supabase database:
echo    - Run the SQL commands in database/setup.sql
echo.
echo 3. Start the development server:
echo    npm run dev
echo.
echo 4. Test the API:
echo    curl http://localhost:3001/health
echo.
echo 📚 Documentation:
echo    - README.md for complete setup guide
echo    - docs/postman-collection.json for API testing
echo.
echo 🔧 Useful commands:
echo    npm run dev     - Start development server
echo    npm start       - Start production server
echo    npm run lint    - Run code linting
echo    npm run format  - Format code
echo.
pause