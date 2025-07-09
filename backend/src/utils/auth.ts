import jwt from 'jsonwebtoken';

export const generateTokens = (userId: string, email?: string, username?: string) => {
  // DÜZELTME: Token'da id field'ını kullanarak tutarlılık sağlıyoruz
  const payload = {
    id: userId,      // userId yerine id kullanıyoruz
    userId,          // Geriye uyumluluk için
    email,
    username
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
};