import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { generateTokens } from '../utils/auth';

const router = express.Router();

// İyileştirilmiş validation kuralları - açıklayıcı error mesajları ile
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi girin (örnek: kullanici@email.com)'),
  
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Kullanıcı adı 3-20 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Ad alanı boş bırakılamaz ve en fazla 50 karakter olabilir'),
  
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Soyad alanı boş bırakılamaz ve en fazla 50 karakter olabilir'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Şifre en az bir harf ve bir rakam içermelidir')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre alanı boş bırakılamaz')
];

// Register endpoint
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    // Validation sonuçlarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Girdiğiniz bilgiler geçersiz',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    const { email, username, firstName, lastName, password } = req.body;

    // Kullanıcının mevcut olup olmadığını kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      const message = field === 'email' 
        ? 'Bu e-posta adresi zaten kullanılıyor' 
        : 'Bu kullanıcı adı zaten alınmış';
        
      return res.status(400).json({
        success: false,
        message,
        errors: [{
          field,
          message,
          value: field === 'email' ? email : username
        }]
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true
      }
    });

    // Token oluştur
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      success: true,
      message: 'Hesabınız başarıyla oluşturuldu',
      user,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    // Validation sonuçlarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Girdiğiniz bilgiler geçersiz',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi veya şifre hatalı',
        errors: [{
          field: 'email',
          message: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı',
          value: email
        }]
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi veya şifre hatalı',
        errors: [{
          field: 'password',
          message: 'Girdiğiniz şifre hatalı',
          value: ''
        }]
      });
    }

    // Banned kontrolü
    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız askıya alınmıştır',
        errors: [{
          field: 'account',
          message: user.banReason || 'Hesabınız geçici olarak askıya alınmıştır',
          value: ''
        }]
      });
    }

    // Kullanıcı durumunu güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isOnline: true, 
        lastSeen: new Date() 
      }
    });

    // Token oluştur
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isOnline: true
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token gerekli',
        errors: [{
          field: 'refreshToken',
          message: 'Refresh token sağlanmadı',
          value: ''
        }]
      });
    }

    // Token'ı doğrula ve yeni token'lar oluştur
    // Bu kısım refresh token logic'i için genişletilmeli

    res.json({
      success: true,
      message: 'Token yenilendi',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Geçersiz refresh token',
      errors: [{
        field: 'refreshToken',
        message: 'Refresh token geçersiz veya süresi dolmuş',
        value: ''
      }]
    });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Bu kısımda token'ı blacklist'e ekleyebilirsiniz
    res.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Çıkış yapılırken hata oluştu'
    });
  }
});

export default router;