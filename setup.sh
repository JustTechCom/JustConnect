#!/bin/bash

echo "========================================"
echo "     JustConnect Backend Kurulum"
echo "========================================"
echo

echo "[1/4] Backend dizinine geçiliyor..."
cd backend

echo "[2/4] Bağımlılıklar yükleniyor..."
npm install

echo "[3/4] TypeScript derleniyor..."
npm run build

echo "[4/4] Prisma client oluşturuluyor..."
npm run db:generate

echo
echo "========================================"
echo "        Kurulum Tamamlandı!"
echo "========================================"
echo
echo "Projenizi başlatmak için:"
echo "  cd backend"
echo "  npm run dev"
echo
echo "Database'i kurmak için (PostgreSQL gerekli):"
echo "  npm run db:setup"
echo
echo "Sağlıklı geliştirmeler!"
echo "========================================"