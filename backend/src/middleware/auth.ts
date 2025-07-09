import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Bearer <token> formatında mı?
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      id?: string;
      userId?: string;
      email: string;
      username: string;
    };

    // Hem yeni (id) hem eski (userId) sürümleri destekleniyor
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token payload: missing user ID' });
    }

    req.user = {
      id: userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
