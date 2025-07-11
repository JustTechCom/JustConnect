#!/bin/bash

# Render Start Script - start.sh
# Bu dosyayı frontend klasörüne ekleyin

echo "🌟 Starting JustConnect Frontend..."

# Check if build exists
if [ ! -d "build" ]; then
    echo "❌ Build directory not found. Running build first..."
    npm run build
fi

# Port configuration
PORT=${PORT:-80}

echo "🚀 Starting server on port $PORT..."
echo "📁 Serving from: $(pwd)/build"

# List build contents for debugging
echo "📂 Build directory contents:"
ls -la build/

# Start the server
npx serve -s build -l $PORT --cors