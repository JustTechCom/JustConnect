// backend/src/routes/admin.ts
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';
import { emailService } from '../services/emailService';
import { redis } from '../config/redis';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req: any, res: Response, next: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Apply auth and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard Overview
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalMessages,
      totalChats,
      todayRegistrations,
      todayMessages,
      onlineUsers,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.message.count(),
      prisma.chat.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      redis.scard('online_users'),
      getRecentActivity(),
    ]);

    const businessMetrics = await analyticsService.getBusinessMetrics();
    const realTimeAnalytics = await analyticsService.getRealTimeAnalytics();

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalMessages,
        totalChats,
        todayRegistrations,
        todayMessages,
        onlineUsers,
      },
      businessMetrics,
      realTimeAnalytics,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// User Management
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isOnline = true;
    } else if (status === 'inactive') {
      where.lastSeen = { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
          verified: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              sentMessages: true,
              chatMembers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user details
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sentMessages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { chat: { select: { name: true, type: true } } },
        },
        chatMembers: {
          include: {
            chat: { select: { name: true, type: true, _count: { select: { members: true } } } },
          },
        },
        _count: {
          select: {
            sentMessages: true,
            chatMembers: true,
            createdChats: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const engagementMetrics = await analyticsService.getUserEngagementMetrics(id);

    res.json({
      user,
      engagementMetrics,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user
router.put('/users/:id', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['USER', 'ADMIN', 'MODERATOR']),
  body('verified').optional().isBoolean(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        verified: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Ban/Unban user
router.post('/users/:id/ban', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body;

    await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason,
        banExpiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Send ban notification email
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Account Suspended',
        html: `
          <h2>Your account has been suspended</h2>
          <p>Reason: ${reason}</p>
          ${duration ? `<p>Duration: ${duration} days</p>` : '<p>This suspension is permanent.</p>'}
          <p>If you believe this is a mistake, please contact support.</p>
        `,
      });
    }

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:id/unban', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null,
        banExpiresAt: null,
      },
    });

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Chat Management
router.get('/chats', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { username: true, firstName: true, lastName: true } },
          _count: {
            select: { members: true, messages: true },
          },
        },
      }),
      prisma.chat.count({ where }),
    ]);

    res.json({
      chats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Delete chat
router.delete('/chats/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.chat.delete({ where: { id } });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Message Management
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, chatId, userId, flagged } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (chatId) {
      where.chatId = chatId;
    }

    if (userId) {
      where.senderId = userId;
    }

    if (flagged === 'true') {
      where.flagged = true;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { username: true, firstName: true, lastName: true } },
          chat: { select: { name: true, type: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete message
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.message.delete({ where: { id } });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// System Settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await redis.hgetall('system_settings');
    
    res.json({
      settings: {
        maintenanceMode: settings.maintenanceMode === 'true',
        registrationEnabled: settings.registrationEnabled !== 'false',
        maxFileSize: parseInt(settings.maxFileSize || '10'),
        messageRateLimit: parseInt(settings.messageRateLimit || '30'),
        allowedFileTypes: settings.allowedFileTypes?.split(',') || [],
        ...settings,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    // Convert arrays to strings for Redis storage
    const redisSettings = { ...settings };
    if (redisSettings.allowedFileTypes) {
      redisSettings.allowedFileTypes = redisSettings.allowedFileTypes.join(',');
    }

    await redis.hmset('system_settings', redisSettings);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [
      businessMetrics,
      popularFeatures,
      realTimeAnalytics,
    ] = await Promise.all([
      analyticsService.getBusinessMetrics(start, end),
      analyticsService.getPopularFeatures(),
      analyticsService.getRealTimeAnalytics(),
    ]);

    res.json({
      businessMetrics,
      popularFeatures,
      realTimeAnalytics,
      dateRange: { start, end },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Broadcast message to all users
router.post('/broadcast', [
  body('title').notEmpty().trim(),
  body('message').notEmpty().trim(),
  body('type').isIn(['info', 'warning', 'success', 'error']),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type, sendEmail } = req.body;

    // Save broadcast to database
    const broadcast = await prisma.broadcast.create({
      data: {
        title,
        message,
        type,
        sentBy: req.user.id,
        sentAt: new Date(),
      },
    });

    // Send via WebSocket to online users
    // This would be implemented with Socket.io

    // Send email notification if requested
    if (sendEmail) {
      const users = await prisma.user.findMany({
        select: { email: true, firstName: true },
      });

      await emailService.sendBulkEmail(
        users.map(user => ({
          to: user.email,
          subject: title,
          template: 'broadcast',
          data: { firstName: user.firstName, title, message },
        }))
      );
    }

    res.json({ message: 'Broadcast sent successfully', broadcastId: broadcast.id });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// System Health Check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [
      dbHealth,
      redisHealth,
      diskUsage,
      memoryUsage,
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      getDiskUsage(),
      getMemoryUsage(),
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
      system: {
        diskUsage,
        memoryUsage,
        uptime: process.uptime(),
      },
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date(),
    });
  }
});

// Helper functions
async function getRecentActivity() {
  const [recentUsers, recentMessages, recentChats] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, firstName: true, lastName: true, createdAt: true },
    }),
    prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { username: true, firstName: true, lastName: true } },
        chat: { select: { name: true, type: true } },
      },
    }),
    prisma.chat.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { username: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
    }),
  ]);

  return {
    recentUsers,
    recentMessages,
    recentChats,
  };
}

async function checkDatabaseHealth() {
  try {
    await prisma.user.count();
    return { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkRedisHealth() {
  try {
    const start = Date.now();
    await redis.ping();
    return { status: 'healthy', responseTime: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

function getDiskUsage() {
  // This would require a system monitoring library
  return { used: '0%', available: '100%' };
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

export default router;