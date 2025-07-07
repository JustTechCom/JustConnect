import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// Get messages for a chat
router.get('/chat/:chatId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', authenticateToken, [
  body('content').notEmpty().trim(),
  body('chatId').notEmpty(),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'LOCATION'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, chatId, type = 'TEXT', replyTo } = req.body;
    const senderId = req.user!.id;

    const message = await prisma.message.create({
      data: {
        content,
        type,
        chatId,
        senderId,
        replyTo
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Update chat last message
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date()
      }
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;