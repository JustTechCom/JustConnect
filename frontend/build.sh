#!/bin/bash

# Render Build Script - build.sh
# Bu dosyayı frontend klasörüne ekleyin

echo "🚀 Building JustConnect Frontend..."

# Environment variables
export GENERATE_SOURCEMAP=false
export CI=false
export SKIP_PREFLIGHT_CHECK=true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building React app..."
npm run build

# Check if build directory exists
if [ -d "build" ]; then
    echo "✅ Build successful! Files created:"
    ls -la build/
    echo "📁 Static files:"
    find build/static -name "*.js" -o -name "*.css" | head -5
else
    echo "❌ Build failed - no build directory found"
    exit 1
fi

echo "🎉 Build completed successfully!"