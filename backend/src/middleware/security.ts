// backend/src/middleware/security.ts
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationChain } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Enhanced rate limiting
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return userId ? `${req.ip}-${userId}` : req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Specific rate limits
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100);
export const messageRateLimit = createRateLimit(60 * 1000, 30, 'Too many messages sent');
export const uploadRateLimit = createRateLimit(60 * 1000, 10, 'Too many uploads');

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// CSRF Protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = (req as any).session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }

  let files: Express.Multer.File[] = [];
  if (req.file) {
    files = [req.file];
  } else if (req.files) {
    files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  }

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large' });
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'File type not allowed.' });
    }

    // Virus scanning (integrate with ClamAV or similar)
    // For now, just check for suspicious file signatures
    const suspiciousSignatures = [
      Buffer.from('4D5A', 'hex'), // PE executable
      Buffer.from('7F454C46', 'hex'), // ELF executable
      Buffer.from('213C617263683E', 'hex'), // Archive
    ];

    const fileBuffer = file.buffer || Buffer.from(file.path);
    for (const signature of suspiciousSignatures) {
      if (fileBuffer.indexOf(signature) === 0) {
        return res.status(400).json({ error: 'Suspicious file detected.' });
      }
    }
  }

  next();
};

// Request validation
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  };
};

// Common validation rules
export const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),

  username: body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),

  name: body(['firstName', 'lastName'])
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be 1-50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  chatId: body('chatId')
    .isUUID()
    .withMessage('Invalid chat ID'),

  messageContent: body('content')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be 1-4000 characters')
    .trim()
};

// IP Whitelist/Blacklist
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;

  // Blacklisted IPs (could be stored in database/redis)
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];

  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check for admin routes
  if (req.path.startsWith('/admin')) {
    const whitelistedIPs = process.env.ADMIN_WHITELISTED_IPS?.split(',') || [];
    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Admin access restricted' });
    }
  }

  next();
};

// API Key validation for external services
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/external')) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: res.statusCode,
      duration,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString(),
    };

    // Log suspicious activities
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security Alert:', logData);
    }

    // Could integrate with external security monitoring service
  });

  next();
};

// Honeypot endpoints to catch bots
export const honeypot = (req: Request, res: Response, next: NextFunction) => {
  const honeypotPaths = ['/admin.php', '/wp-admin', '/.env', '/config.php'];

  if (honeypotPaths.some(path => req.path.includes(path))) {
    console.warn('Honeypot triggered:', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });

    // Add IP to temporary blacklist
    // Could integrate with fail2ban or similar

    return res.status(404).end();
  }

  next();
};

// JWT Security enhancements
export const enhancedJWTValidation = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT configuration error' });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check token expiration with grace period
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && now > decoded.exp + 60) { // 1 minute grace period
      return res.status(401).json({ error: 'Token expired' });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
