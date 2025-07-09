// backend/src/routes/messages.ts - Enhanced message handling
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../app';

const router = express.Router();

// Get messages for a chat with pagination
router.get('/chat/:chatId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
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

    // Build query filters
    const where: any = {
      chatId,
      isDeleted: false
    };

    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        file: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            url: true,
            thumbnailUrl: true,
            duration: true
          }
        },
        replyToMessage: {
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
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: before ? 0 : (Number(page) - 1) * Number(limit)
    });

    // Mark messages as delivered for the requesting user
    const undeliveredMessages = messages
      .filter(msg => msg.senderId !== userId && !msg.delivered)
      .map(msg => msg.id);

    if (undeliveredMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: undeliveredMessages }
        },
        data: { delivered: true }
      });

      // Notify senders about delivery status
      const senderIds = messages
        .filter(msg => undeliveredMessages.includes(msg.id))
        .map(msg => msg.senderId);

      [...new Set(senderIds)].forEach(senderId => {
        io.to(`user_${senderId}`).emit('messages_delivered', {
          chatId,
          messageIds: undeliveredMessages,
          deliveredBy: userId
        });
      });
    }

    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === Number(limit),
      page: Number(page)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message with enhanced validation
router.post('/', authenticateToken, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 4000 }),
  body('chatId').notEmpty().withMessage('Chat ID is required'),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'LOCATION']),
  body('replyTo').optional().isString()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, chatId, type = 'TEXT', replyTo, fileId } = req.body;
    const senderId = req.user!.id;

    // Verify user is a member of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: senderId,
        leftAt: null
      },
      include: {
        chat: {
          select: {
            type: true,
            members: {
              where: { leftAt: null },
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Validate reply message if provided
    if (replyTo) {
      const replyMessage = await prisma.message.findFirst({
        where: {
          id: replyTo,
          chatId,
          isDeleted: false
        }
      });

      if (!replyMessage) {
        return res.status(400).json({ error: 'Reply message not found' });
      }
    }

    // Validate file if provided
    let fileData = null;
    if (fileId) {
      fileData = await prisma.file.findFirst({
        where: {
          id: fileId,
          userId: senderId
        }
      });

      if (!fileData) {
        return res.status(400).json({ error: 'File not found' });
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        type,
        chatId,
        senderId,
        replyTo,
        fileId
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
        },
        file: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            url: true,
            thumbnailUrl: true,
            duration: true
          }
        },
        replyToMessage: {
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
        }
      }
    });

    // Update chat last message
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: type === 'TEXT' ? content : `${type.toLowerCase()} message`,
        lastMessageAt: new Date()
      }
    });

    // Send real-time message to all chat members
    const memberIds = membership.chat.members.map(m => m.userId);
    memberIds.forEach(memberId => {
      if (memberId !== senderId) {
        io.to(`user_${memberId}`).emit('new_message', {
          ...message,
          chatId,
          isNew: true
        });
      }
    });

    // Send confirmation to sender
    io.to(`user_${senderId}`).emit('message_sent', {
      tempId: req.body.tempId, // For client-side message handling
      message
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
router.post('/mark-read', authenticateToken, [
  body('chatId').notEmpty(),
  body('messageIds').isArray().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId, messageIds } = req.body;
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

    // Update messages as read
    const updatedMessages = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        chatId,
        senderId: { not: userId }, // Can't mark own messages as read
        read: false
      },
      data: { 
        read: true,
        delivered: true // Ensure delivered is also true
      }
    });

    // Get sender IDs for notifications
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        chatId
      },
      select: { senderId: true }
    });

    // Notify senders about read status
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    senderIds.forEach(senderId => {
      if (senderId !== userId) {
        io.to(`user_${senderId}`).emit('messages_read', {
          chatId,
          messageIds,
          readBy: userId
        });
      }
    });

    res.json({ 
      message: 'Messages marked as read',
      count: updatedMessages.count 
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit message
router.put('/:messageId', authenticateToken, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 4000 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false
      },
      include: {
        chat: {
          include: {
            members: {
              where: { leftAt: null },
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or you do not have permission to edit it' });
    }

    // Check if message is too old to edit (24 hours)
    const hoursSinceCreated = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 24) {
      return res.status(400).json({ error: 'Cannot edit messages older than 24 hours' });
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        edited: true
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
        },
        file: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            url: true,
            thumbnailUrl: true,
            duration: true
          }
        },
        replyToMessage: {
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
        }
      }
    });

    // Notify all chat members about the edit
    const memberIds = message.chat.members.map(m => m.userId);
    memberIds.forEach(memberId => {
      io.to(`user_${memberId}`).emit('message_edited', updatedMessage);
    });

    res.json({ message: updatedMessage });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
router.delete('/:messageId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Find the message and verify permissions
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        isDeleted: false
      },
      include: {
        chat: {
          include: {
            members: {
              where: { 
                userId,
                leftAt: null 
              },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permissions (own message or admin/moderator)
    const canDelete = message.senderId === userId || 
                     message.chat.members.some(m => ['ADMIN', 'MODERATOR'].includes(m.role));

    if (!canDelete) {
      return res.status(403).json({ error: 'You do not have permission to delete this message' });
    }

    // Soft delete the message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'This message was deleted'
      }
    });

    // Get chat members for notification
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        chatId: message.chatId,
        leftAt: null
      },
      select: { userId: true }
    });

    // Notify all chat members about deletion
    chatMembers.forEach(member => {
      io.to(`user_${member.userId}`).emit('message_deleted', {
        messageId,
        chatId: message.chatId,
        deletedBy: userId
      });
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add reaction to message
router.post('/:messageId/reaction', authenticateToken, [
  body('emoji').notEmpty().withMessage('Emoji is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        isDeleted: false,
        chat: {
          members: {
            some: {
              userId,
              leftAt: null
            }
          }
        }
      },
      include: {
        chat: {
          include: {
            members: {
              where: { leftAt: null },
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji
      }
    });

    if (existingReaction) {
      // Remove reaction
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });

      // Notify chat members
      message.chat.members.forEach(member => {
        io.to(`user_${member.userId}`).emit('reaction_removed', {
          messageId,
          emoji,
          userId
        });
      });

      res.json({ message: 'Reaction removed' });
    } else {
      // Add reaction
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        }
      });

      // Notify chat members
      message.chat.members.forEach(member => {
        io.to(`user_${member.userId}`).emit('reaction_added', {
          messageId,
          emoji,
          userId
        });
      });

      res.json({ message: 'Reaction added' });
    }
  } catch (error) {
    console.error('Message reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search messages in chat
router.get('/chat/:chatId/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { q, limit = 20 } = req.query;
    const userId = req.user!.id;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

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

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
        content: {
          contains: q,
          mode: 'insensitive'
        }
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
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json({ messages, query: q });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;