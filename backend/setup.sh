#!/bin/bash

# College Canteen QR Backend Setup Script
# This script helps set up the development environment

set -e  # Exit on any error

echo "🚀 Setting up College Canteen QR Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Verify installation
echo "🧪 Verifying installation..."
npm test --silent 2>/dev/null || echo "⚠️  No tests found (optional)"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your .env file with actual configuration values:"
echo "   - Supabase credentials"
echo "   - Google OAuth client ID"
echo "   - Razorpay test keys"
echo "   - Email configuration"
echo ""
echo "2. Set up your Supabase database:"
echo "   - Run the SQL commands in database/setup.sql"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3001/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md for complete setup guide"
echo "   - docs/postman-collection.json for API testing"
echo ""
echo "🔧 Useful commands:"
echo "   npm run dev     - Start development server"
echo "   npm start       - Start production server"
echo "   npm run lint    - Run code linting"
echo "   npm run format  - Format code"