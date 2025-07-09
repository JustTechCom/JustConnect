import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // DÜZELTME: Artık token'da id field'ı da var
    // Geriye uyumluluk için hem id hem userId'yi kontrol ediyoruz
    req.user = {
      id: decoded.id || decoded.userId, // id varsa onu, yoksa userId'yi kullan
      email: decoded.email,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};