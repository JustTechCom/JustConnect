@echo off
echo ========================================
echo     JustConnect Backend Kurulum
echo ========================================
echo.

echo [1/4] Backend dizinine geciliyor...
cd backend

echo [2/4] Bagimliliklar yukleniyor...
call npm install

echo [3/4] TypeScript derleniyor...
call npm run build

echo [4/4] Prisma client olusturuluyor...
call npm run db:generate

echo.
echo ========================================
echo        Kurulum Tamamlandi!
echo ========================================
echo.
echo Projenizi baslatmak icin:
echo   cd backend
echo   npm run dev
echo.
echo Database'i kurmak icin (PostgreSQL gerekli):
echo   npm run db:setup
echo.
echo Saglikli gelistirmeler!
echo ========================================

pause