#!/bin/bash
set -e

echo "🔨 Building BurkinaWatch for Render..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci
fi

# Build the project
echo "🏗️  Building frontend and backend..."
npm run build

echo "✅ Build complete! Ready for deployment."
