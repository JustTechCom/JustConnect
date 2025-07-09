# JustConnect - Profesyonel Mesajlaşma Uygulaması

Tam özellikli, gerçek zamanlı mesajlaşma uygulaması. Modern teknolojilerle geliştirilmiş, production-ready backend API.

## 🚀 Özellikler

✅ **Gerçek Zamanlı Mesajlaşma** - Socket.io ile anlık mesajlaşma
✅ **JWT Authentication** - Güvenli kimlik doğrulama
✅ **PostgreSQL Database** - Prisma ORM ile güçlü veritabanı
✅ **Redis Caching** - Performans optimizasyonu
✅ **TypeScript** - Type safety ve modern JS özellikleri
✅ **RESTful API** - Standard API yapısı
✅ **Input Validation** - Express-validator ile güvenlik
✅ **Error Handling** - Kapsamlı hata yönetimi
✅ **CORS & Security** - Production güvenlik ayarları

## 🛠️ Teknoloji Stack'i

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **Socket.io** (Real-time)
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **JWT Authentication**

### Frontend (Planlanan)
- **React.js**
- **TypeScript**
- **Tailwind CSS**
- **Socket.io-client**
- **Redux Toolkit**

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL
- Redis (opsiyonel)

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
cd backend
npm install
```

2. **Environment variables ayarlayın:**
`.env` dosyasındaki değişkenleri güncelleyin:
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key"
```

3. **Database'i kurun:**
```bash
npm run db:setup
```

4. **Uygulamayı başlatın:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📁 Proje Yapısı

```
backend/
├── src/
│   ├── app.ts              # Ana uygulama
│   ├── config/             # Konfigürasyon dosyaları
│   ├── types/              # TypeScript tip tanımları
│   ├── middleware/         # Express middleware'leri
│   ├── utils/              # Yardımcı fonksiyonlar
│   ├── routes/             # API route'ları
│   └── services/           # İş mantığı servisleri
├── prisma/
│   └── schema.prisma       # Database şeması
├── package.json
├── tsconfig.json
└── .env                    # Environment variables
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

### Users
- `GET /api/users/me` - Kullanıcı profili
- `GET /api/users/search` - Kullanıcı arama

### Chats
- `GET /api/chats` - Kullanıcının sohbetleri
- `POST /api/chats` - Yeni sohbet oluştur

### Messages
- `GET /api/messages/chat/:chatId` - Sohbet mesajları
- `POST /api/messages` - Mesaj gönder

### Health Check
- `GET /health` - Sistem durumu

## 🔌 Socket.io Events

### Client → Server
- `join_chats` - Kullanıcı sohbetlerine katıl
- `send_message` - Mesaj gönder
- `typing_start` - Yazma göstergesi başlat
- `typing_stop` - Yazma göstergesi durdur

### Server → Client
- `new_message` - Yeni mesaj bildirim
- `user_typing` - Kullanıcı yazıyor
- `user_stopped_typing` - Kullanıcı yazmayı bıraktı

## 🚀 Deployment

### Render.com
1. GitHub repo'sunu bağla
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build && npm run db:generate`
4. Start Command: `npm start`
5. Environment variables'ları ekle

### Docker (İsteğe bağlı)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔐 Güvenlik

- JWT token authentication
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- CORS configuration
- SQL injection koruması (Prisma ORM)

## 📊 Database Schema

### Users
- User bilgileri, profil, online status

### Chats
- Direkt, grup ve kanal sohbetleri

### Messages
- Mesajlar, tipler, durum bilgileri

### ChatMembers
- Sohbet üyelikleri ve rolleri

## 🔧 Geliştirme

### Kullanışlı Komutlar
```bash
npm run dev          # Development server
npm run build        # TypeScript build
npm run db:studio    # Prisma Studio
npm run db:reset     # Database reset
```

### Kod Kalitesi
- TypeScript strict mode
- ESLint konfigürasyonu
- Prettier code formatting

## 📝 Lisans

MIT License

## 👥 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun
3. Commit'lerinizi yapın
4. Pull request açın

## 📞 İletişim

- GitHub: [kadirertancam]
- Email: [info@justtech.work]

---

**JustConnect** - Profesyonel mesajlaşma çözümü 🚀