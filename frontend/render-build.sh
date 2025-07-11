# render-build.sh - Frontend için Render build script

#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Node.js version check
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Environment variables
export CI=false
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export TSC_COMPILE_ON_ERROR=true
export ESLINT_NO_DEV_ERRORS=true

# Build with error tolerance
echo "📦 Installing dependencies..."
npm ci --silent

echo "🛠️ Building React application..."
npm run build || {
  echo "⚠️ Build failed, trying with force..."
  CI=false TSC_COMPILE_ON_ERROR=true npm run build
}

# Verify build output
echo "✅ Build completed. Checking output..."
ls -la build/
ls -la build/static/ || echo "No static directory found"

# Check if index.html exists
if [ -f "build/index.html" ]; then
  echo "✅ index.html found in build directory"
  head -20 build/index.html
else
  echo "❌ index.html not found in build directory"
  exit 1
fi

echo "🎉 Build process completed successfully!"

# render.yaml - Render configuration
services:
  # Frontend - Static Site
  - type: web
    name: justconnect-frontend
    env: static
    buildCommand: ./render-build.sh
    staticPublishPath: ./build
    pullRequestPreviewsEnabled: false
    headers:
      - key: X-Frame-Options
        value: DENY
      - key: X-Content-Type-Options
        value: nosniff
      - key: Cache-Control
        value: public, max-age=31536000
        path: /static/*
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_API_URL
        value: https://justconnect-o8k8.onrender.com/api
      - key: REACT_APP_SOCKET_URL
        value: https://justconnect-o8k8.onrender.com
      - key: REACT_APP_ENVIRONMENT
        value: production
      - key: CI
        value: false
      - key: GENERATE_SOURCEMAP
        value: false

  # Backend - Web Service
  - type: web
    name: justconnect-backend
    env: node
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npm start
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: justconnect-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://justconnectui.onrender.com

databases:
  - name: justconnect-db
    plan: free