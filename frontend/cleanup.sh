#!/bin/bash

# Cache Temizleme Script - cleanup.sh
# Bu scripti frontend klasöründe çalıştırın

echo "🧹 Cache temizleniyor..."

# Node modules cache temizle
echo "📦 Node modules cache temizleniyor..."
npm cache clean --force

# Build klasörünü temizle
echo "🗂️ Build klasörü temizleniyor..."
rm -rf build/

# TypeScript cache temizle
echo "📝 TypeScript cache temizleniyor..."
rm -rf node_modules/.cache/

# React Scripts cache temizle
echo "⚛️ React Scripts cache temizleniyor..."
rm -rf node_modules/.cache/babel-loader/
rm -rf node_modules/.cache/eslint-loader/
rm -rf node_modules/.cache/terser-webpack-plugin/

# Webpack cache temizle
echo "📦 Webpack cache temizleniyor..."
rm -rf .cache/

# Package-lock.json yeniden oluştur
echo "🔒 Package lock yenileniyor..."
rm -f package-lock.json
npm install

echo "✅ Cache temizleme tamamlandı!"
echo ""
echo "🚀 Şimdi şu komutları çalıştırın:"
echo "npm start   # Development server için"
echo "npm run build   # Production build için"