// backend/src/routes/chats.ts - Enhanced chat management
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../app';

const router = express.Router();

// Get user's chats with enhanced data
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: { 
            messages: {
              where: {
                isDeleted: false
              }
            }
          }
        }
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
          lastMessage: chat.messages[0] || null
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
            ...memberIds.map((userId: string) => ({ userId, role: 'MEMBER' }))
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

    // Send system message for group/channel creation
    if (type !== 'DIRECT') {
      const systemMessage = await prisma.message.create({
        data: {
          content: `${req.user!.firstName} ${req.user!.lastName} created the ${type.toLowerCase()}`,
          type: 'SYSTEM',
          chatId: chat.id,
          senderId: createdBy
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

      // Emit system message to all members
      chat.members.forEach(member => {
        io.to(`user_${member.userId}`).emit('new_message', systemMessage);
      });
    }

    // Notify all members about new chat
    memberIds.forEach((memberId: string) => {
      io.to(`user_${memberId}`).emit('new_chat', chat);
    });

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific chat details
router.get('/:chatId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.id;

    // Verify user is a member of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chat
router.put('/:chatId', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().isURL()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user!.id;

    // Check if user is admin of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: { in: ['ADMIN', 'MODERATOR'] },
        leftAt: null
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You do not have permission to update this chat' });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(avatar && { avatar })
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
        }
      }
    });

    // Notify all members about chat update
    updatedChat.members.forEach(member => {
      io.to(`user_${member.userId}`).emit('chat_updated', updatedChat);
    });

    res.json({ chat: updatedChat });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add members to chat
router.post('/:chatId/members', authenticateToken, [
  body('memberIds').isArray().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user!.id;

    // Check if user can add members (admin/moderator or group chat)
    const [membership, chat] = await Promise.all([
      prisma.chatMember.findFirst({
        where: {
          chatId,
          userId,
          leftAt: null
        }
      }),
      prisma.chat.findUnique({
        where: { id: chatId },
        select: { type: true }
      })
    ]);

    if (!membership || !chat) {
      return res.status(404).json({ error: 'Chat not found or you are not a member' });
    }

    if (chat.type === 'DIRECT') {
      return res.status(400).json({ error: 'Cannot add members to direct chat' });
    }

    if (membership.role === 'MEMBER' && chat.type === 'CHANNEL') {
      return res.status(403).json({ error: 'Only admins can add members to channels' });
    }

    // Validate new members
    const validMembers = await prisma.user.findMany({
      where: { 
        id: { in: memberIds },
        banned: false 
      },
      select: { id: true, firstName: true, lastName: true }
    });

    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ error: 'Some users are invalid or banned' });
    }

    // Check which users are not already members
    const existingMembers = await prisma.chatMember.findMany({
      where: {
        chatId,
        userId: { in: memberIds },
        leftAt: null
      },
      select: { userId: true }
    });

    const existingMemberIds = existingMembers.map(m => m.userId);
    const newMemberIds = memberIds.filter((id: string) => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ error: 'All users are already members' });
    }

    // Add new members
    await prisma.chatMember.createMany({
      data: newMemberIds.map((memberId: string) => ({
        chatId,
        userId: memberId,
        role: 'MEMBER'
      }))
    });

    // Create system message
    const addedUsers = validMembers.filter(user => newMemberIds.includes(user.id));
    const systemMessage = await prisma.message.create({
      data: {
        content: `${req.user!.firstName} ${req.user!.lastName} added ${addedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}`,
        type: 'SYSTEM',
        chatId,
        senderId: userId
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

    // Get updated chat
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
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
        }
      }
    });

    // Notify all members
    updatedChat?.members.forEach(member => {
      io.to(`user_${member.userId}`).emit('new_message', systemMessage);
      io.to(`user_${member.userId}`).emit('chat_updated', updatedChat);
    });

    // Notify new members specifically
    newMemberIds.forEach((memberId: string) => {
      io.to(`user_${memberId}`).emit('new_chat', updatedChat);
    });

    res.json({ 
      message: 'Members added successfully', 
      chat: updatedChat,
      addedMembers: addedUsers 
    });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave chat
router.post('/:chatId/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null
      },
      include: {
        chat: {
          select: { type: true, createdBy: true }
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this chat' });
    }

    if (membership.chat.type === 'DIRECT') {
      return res.status(400).json({ error: 'Cannot leave direct chat' });
    }

    // Update membership
    await prisma.chatMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() }
    });

    // Create system message
    const systemMessage = await prisma.message.create({
      data: {
        content: `${req.user!.firstName} ${req.user!.lastName} left the ${membership.chat.type.toLowerCase()}`,
        type: 'SYSTEM',
        chatId,
        senderId: userId
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

    // Get remaining members
    const remainingMembers = await prisma.chatMember.findMany({
      where: {
        chatId,
        leftAt: null
      },
      select: { userId: true }
    });

    // Notify remaining members
    remainingMembers.forEach(member => {
      io.to(`user_${member.userId}`).emit('new_message', systemMessage);
      io.to(`user_${member.userId}`).emit('member_left', {
        chatId,
        userId,
        memberCount: remainingMembers.length
      });
    });

    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pin/Unpin chat
router.put('/:chatId/pin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.id;

    // Verify membership
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this chat' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { isPinned: true }
    });

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { isPinned: !chat?.isPinned }
    });

    res.json({ 
      message: `Chat ${updatedChat.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: updatedChat.isPinned 
    });
  } catch (error) {
    console.error('Pin/Unpin chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;