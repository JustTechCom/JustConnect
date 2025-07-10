// backend/src/routes/chats.ts - Düzeltilmiş TypeScript Hatası

import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../app';

const router = express.Router();

// Get user's chats with enhanced data - DÜZELTME
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { 
            userId,
            leftAt: null 
          }
        },
        isArchived: false
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        // ✅ Son mesajları almak için messages relation'ı kullan
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        // ✅ Mesaj sayısı için _count kullan
        _count: {
          select: { 
            messages: {
              where: {
                isDeleted: false
              }
            }
          }
        }
        // ❌ KALDIRILDI: lastMessage - bu bir relation değil, string field
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get unread message counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            read: false,
            isDeleted: false
          }
        });

        // Get the other user's info for direct chats
        let otherUser = null;
        if (chat.type === 'DIRECT') {
          const otherMember = chat.members.find(member => member.userId !== userId);
          if (otherMember) {
            otherUser = otherMember.user;
          }
        }

        return {
          ...chat,
          unreadCount,
          otherUser,
          // ✅ En son mesajı messages array'inden al
          lastMessageObject: chat.messages[0] || null
        };
      })
    );

    res.json({ chats: chatsWithUnread });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new chat
router.post('/', authenticateToken, [
  body('type').isIn(['DIRECT', 'GROUP', 'CHANNEL']),
  body('memberIds').isArray().isLength({ min: 1 }),
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, memberIds, name, description } = req.body;
    const createdBy = req.user!.id;

    // Validate member IDs
    const validMembers = await prisma.user.findMany({
      where: { 
        id: { in: memberIds },
        banned: false 
      },
      select: { id: true }
    });

    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ error: 'Some users are invalid or banned' });
    }

    // For direct chats, check if chat already exists
    if (type === 'DIRECT') {
      if (memberIds.length !== 1) {
        return res.status(400).json({ error: 'Direct chat must have exactly one other member' });
      }

      const otherUserId = memberIds[0];
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          members: {
            every: {
              userId: { in: [createdBy, otherUserId] }
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      if (existingChat && existingChat.members.length === 2) {
        return res.json({ chat: existingChat });
      }
    }

    // Create the chat
    const chat = await prisma.chat.create({
      data: {
        type,
        name: type === 'DIRECT' ? null : name,
        description,
        createdBy,
        members: {
          create: [
            { userId: createdBy, role: type === 'DIRECT' ? 'MEMBER' : 'ADMIN' },
            ...memberIds.map((memberId: string) => ({
              userId: memberId,
              role: 'MEMBER' as const
            }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    // Notify all members about the new chat
    chat.members.forEach(member => {
      io.to(`user_${member.userId}`).emit('new_chat', chat);
    });

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single chat
router.get('/:chatId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId,
            leftAt: null
          }
        }
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                verified: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { 
            messages: true 
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;