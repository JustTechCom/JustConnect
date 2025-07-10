// backend/src/routes/messages.ts - Düzeltilmiş ve Güvenli Versiyon
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../app';

const router = express.Router();

// ✅ Helper function to format message data safely
const formatMessage = (message: any) => {
  if (!message) return null;

  return {
    id: message.id,
    content: message.content || '',
    type: message.type || 'TEXT',
    chatId: message.chatId,
    senderId: message.senderId,
    replyTo: message.replyTo || null,
    edited: Boolean(message.edited),
    delivered: Boolean(message.delivered),
    read: Boolean(message.read),
    isDeleted: Boolean(message.isDeleted),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt || null,
    
    // ✅ Safely format sender
    sender: message.sender ? {
      id: message.sender.id,
      username: message.sender.username || 'unknown',
      firstName: message.sender.firstName || 'Unknown',
      lastName: message.sender.lastName || 'User',
      avatar: message.sender.avatar || null
    } : {
      id: message.senderId || 'unknown',
      username: 'unknown',
      firstName: 'Unknown',
      lastName: 'User',
      avatar: null
    },

    // ✅ Safely format file attachment
    file: message.file ? {
      id: message.file.id,
      name: message.file.filename || message.file.name || 'Unknown file',
      type: message.file.mimeType || message.file.type || 'application/octet-stream',
      size: message.file.size || 0,
      url: message.file.url || null,
      thumbnailUrl: message.file.thumbnailUrl || null,
      duration: message.file.duration || null
    } : null,

    // ✅ Safely format reply message
    replyToMessage: message.replyToMessage ? {
      id: message.replyToMessage.id,
      content: message.replyToMessage.content || '',
      type: message.replyToMessage.type || 'TEXT',
      senderId: message.replyToMessage.senderId,
      createdAt: message.replyToMessage.createdAt,
      sender: message.replyToMessage.sender ? {
        id: message.replyToMessage.sender.id,
        firstName: message.replyToMessage.sender.firstName || 'Unknown',
        lastName: message.replyToMessage.sender.lastName || 'User',
        avatar: message.replyToMessage.sender.avatar || null
      } : null
    } : null,

    // ✅ Safely format reactions
    reactions: Array.isArray(message.reactions) ? message.reactions.map((reaction: any) => ({
      emoji: reaction.emoji || '❤️',
      userId: reaction.userId,
      count: 1 // This would need to be aggregated properly in a real implementation
    })) : []
  };
};

// ✅ Get messages for a chat with pagination - Enhanced
router.get('/chat/:chatId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { page = '1', limit = '50', before } = req.query;
    const userId = req.user!.id;

    console.log('📨 Fetching messages:', {
      chatId,
      userId,
      page,
      limit,
      before,
      userAgent: req.get('User-Agent')
    });

    // ✅ Enhanced parameter validation
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      console.error('❌ Invalid page parameter:', page);
      res.status(400).json({ error: 'Invalid page parameter', received: page });
      return;
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error('❌ Invalid limit parameter:', limit);
      res.status(400).json({ error: 'Invalid limit parameter (1-100)', received: limit });
      return;
    }

    // ✅ Verify user is a member of the chat
    console.log('🔍 Checking chat membership...');
    let membership;
    try {
      membership = await prisma.chatMember.findFirst({
        where: {
          chatId,
          userId,
          leftAt: null
        }
      });
    } catch (dbError) {
      console.error('❌ Database error checking membership:', dbError);
      res.status(500).json({ error: 'Database error during membership check' });
      return;
    }

    if (!membership) {
      console.error('❌ User not member of chat:', { chatId, userId });
      res.status(403).json({ error: 'You are not a member of this chat' });
      return;
    }

    console.log('✅ User is member of chat');

    // ✅ Build query filters safely
    const where: any = {
      chatId,
      isDeleted: false
    };

    if (before && typeof before === 'string') {
      try {
        const beforeDate = new Date(before);
        if (!isNaN(beforeDate.getTime())) {
          where.createdAt = { lt: beforeDate };
        }
      } catch (dateError) {
        console.warn('⚠️ Invalid before date:', before);
      }
    }

    console.log('🔍 Database query where clause:', where);

    // ✅ Get messages with comprehensive error handling
    let messages;
    try {
      messages = await prisma.message.findMany({
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
        take: limitNum,
        skip: before ? 0 : (pageNum - 1) * limitNum
      });
    } catch (dbError: any) {
      console.error('❌ Database error fetching messages:', {
        error: dbError.message,
        code: dbError.code,
        chatId,
        userId
      });
      
      if (dbError.code === 'P2025') {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }
      
      res.status(500).json({ error: 'Database error fetching messages' });
      return;
    }

    console.log('✅ Messages fetched successfully:', {
      count: messages.length,
      chatId,
      userId
    });

    // ✅ Format messages safely
    const formattedMessages = messages
      .map(formatMessage)
      .filter(msg => msg !== null); // Remove any null messages

    // ✅ Mark messages as delivered (with error handling)
    try {
      const undeliveredMessages = formattedMessages
        .filter(msg => msg.senderId !== userId && !msg.delivered)
        .map(msg => msg.id);

      if (undeliveredMessages.length > 0) {
        console.log('📬 Marking messages as delivered:', undeliveredMessages.length);
        
        await prisma.message.updateMany({
          where: {
            id: { in: undeliveredMessages }
          },
          data: { delivered: true }
        });

        // ✅ Notify senders about delivery status (with error handling)
        try {
          const senderIds = formattedMessages
            .filter(msg => undeliveredMessages.includes(msg.id))
            .map(msg => msg.senderId)
            .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

          senderIds.forEach(senderId => {
            try {
              io.to(`user_${senderId}`).emit('messages_delivered', {
                chatId,
                messageIds: undeliveredMessages,
                deliveredBy: userId
              });
            } catch (socketError) {
              console.warn('⚠️ Socket notification failed for user:', senderId);
            }
          });
        } catch (notifyError) {
          console.warn('⚠️ Failed to notify delivery status:', notifyError);
        }
      }
    } catch (deliveryError) {
      console.error('⚠️ Failed to mark messages as delivered:', deliveryError);
      // Don't fail the request for delivery update errors
    }

    // ✅ Prepare response
    const response = { 
      messages: formattedMessages.reverse(), // Oldest first
      hasMore: messages.length === limitNum,
      page: pageNum,
      totalFetched: formattedMessages.length,
      success: true
    };

    console.log('📤 Sending response:', {
      messageCount: response.messages.length,
      hasMore: response.hasMore,
      page: response.page
    });

    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Get messages error:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      chatId: req.params.chatId,
      userId: req.user?.id,
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Send message with enhanced validation
router.post('/', authenticateToken, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 4000 }),
  body('chatId').notEmpty().withMessage('Chat ID is required'),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'LOCATION']),
  body('replyTo').optional().isString()
], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { content, chatId, type = 'TEXT', replyTo, fileId, tempId } = req.body;
    const senderId = req.user!.id;

    console.log('📝 Creating message:', { chatId, type, senderId, hasReply: !!replyTo });

    // ✅ Verify user is a member of the chat
    let membership;
    try {
      membership = await prisma.chatMember.findFirst({
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
    } catch (dbError) {
      console.error('❌ Database error checking membership:', dbError);
      res.status(500).json({ error: 'Database error during membership check' });
      return;
    }

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this chat' });
      return;
    }

    // ✅ Validate reply message if provided
    if (replyTo) {
      try {
        const replyMessage = await prisma.message.findFirst({
          where: {
            id: replyTo,
            chatId,
            isDeleted: false
          }
        });

        if (!replyMessage) {
          res.status(400).json({ error: 'Reply message not found' });
          return;
        }
      } catch (dbError) {
        console.error('❌ Error validating reply message:', dbError);
        res.status(500).json({ error: 'Error validating reply message' });
        return;
      }
    }

    // ✅ Validate file if provided
    let fileData = null;
    if (fileId) {
      try {
        fileData = await prisma.file.findFirst({
          where: {
            id: fileId,
            userId: senderId
          }
        });

        if (!fileData) {
          res.status(400).json({ error: 'File not found or access denied' });
          return;
        }
      } catch (dbError) {
        console.error('❌ Error validating file:', dbError);
        res.status(500).json({ error: 'Error validating file' });
        return;
      }
    }

    // ✅ Create the message
    let message;
    try {
      message = await prisma.message.create({
        data: {
          content,
          type,
          chatId,
          senderId,
          replyTo: replyTo || null,
          fileId: fileId || null
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
    } catch (dbError: any) {
      console.error('❌ Error creating message:', dbError);
      res.status(500).json({ error: 'Failed to create message' });
      return;
    }

    // ✅ Update chat last message
    try {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessage: type === 'TEXT' ? content : `${type.toLowerCase()} message`,
          lastMessageAt: new Date()
        }
      });
    } catch (updateError) {
      console.warn('⚠️ Failed to update chat last message:', updateError);
      // Don't fail the request for this
    }

    // ✅ Format message for response
    const formattedMessage = formatMessage(message);

    // ✅ Send real-time message to all chat members
    try {
      const memberIds = membership.chat.members.map(m => m.userId);
      memberIds.forEach(memberId => {
        if (memberId !== senderId) {
          try {
            io.to(`user_${memberId}`).emit('new_message', {
              ...formattedMessage,
              chatId,
              isNew: true
            });
          } catch (socketError) {
            console.warn('⚠️ Socket notification failed for user:', memberId);
          }
        }
      });

      // ✅ Send confirmation to sender
      try {
        io.to(`user_${senderId}`).emit('message_sent', {
          tempId: tempId || null,
          message: formattedMessage
        });
      } catch (socketError) {
        console.warn('⚠️ Socket confirmation failed for sender:', senderId);
      }
    } catch (notifyError) {
      console.warn('⚠️ Failed to send real-time notifications:', notifyError);
    }

    console.log('✅ Message created successfully:', message.id);

    res.status(201).json({ 
      message: formattedMessage,
      success: true 
    });
  } catch (error: any) {
    console.error('❌ Send message error:', {
      error: error.message,
      chatId: req.body.chatId,
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Mark messages as read
router.post('/mark-read', authenticateToken, [
  body('chatId').notEmpty(),
  body('messageIds').isArray().isLength({ min: 1 })
], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { chatId, messageIds } = req.body;
    const userId = req.user!.id;

    // ✅ Verify user is a member of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null
      }
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this chat' });
      return;
    }

    // ✅ Update messages as read
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

    // ✅ Get sender IDs for notifications
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        chatId
      },
      select: { senderId: true }
    });

    // ✅ Notify senders about read status
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    senderIds.forEach(senderId => {
      if (senderId !== userId) {
        try {
          io.to(`user_${senderId}`).emit('messages_read', {
            chatId,
            messageIds,
            readBy: userId
          });
        } catch (socketError) {
          console.warn('⚠️ Socket notification failed for read status:', senderId);
        }
      }
    });

    res.json({ 
      message: 'Messages marked as read',
      count: updatedMessages.count,
      success: true
    });
  } catch (error: any) {
    console.error('❌ Mark messages as read error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Edit message
router.put('/:messageId', authenticateToken, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 4000 })
], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // ✅ Find the message and verify ownership
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
      res.status(404).json({ error: 'Message not found or you do not have permission to edit it' });
      return;
    }

    // ✅ Check if message is too old to edit (24 hours)
    const hoursSinceCreated = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 24) {
      res.status(400).json({ error: 'Cannot edit messages older than 24 hours' });
      return;
    }

    // ✅ Update the message
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

    const formattedMessage = formatMessage(updatedMessage);

    // ✅ Notify all chat members about the edit
    const memberIds = message.chat.members.map(m => m.userId);
    memberIds.forEach(memberId => {
      try {
        io.to(`user_${memberId}`).emit('message_edited', formattedMessage);
      } catch (socketError) {
        console.warn('⚠️ Socket notification failed for edit:', memberId);
      }
    });

    res.json({ 
      message: formattedMessage,
      success: true 
    });
  } catch (error: any) {
    console.error('❌ Edit message error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Delete message
router.delete('/:messageId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // ✅ Find the message and verify permissions
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
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // ✅ Check permissions (own message or admin/moderator)
    const canDelete = message.senderId === userId || 
                     message.chat.members.some(m => ['ADMIN', 'MODERATOR'].includes(m.role));

    if (!canDelete) {
      res.status(403).json({ error: 'You do not have permission to delete this message' });
      return;
    }

    // ✅ Soft delete the message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'This message was deleted'
      }
    });

    // ✅ Get chat members for notification
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        chatId: message.chatId,
        leftAt: null
      },
      select: { userId: true }
    });

    // ✅ Notify all chat members about deletion
    chatMembers.forEach(member => {
      try {
        io.to(`user_${member.userId}`).emit('message_deleted', {
          messageId,
          chatId: message.chatId,
          deletedBy: userId
        });
      } catch (socketError) {
        console.warn('⚠️ Socket notification failed for delete:', member.userId);
      }
    });

    res.json({ 
      message: 'Message deleted successfully',
      success: true 
    });
  } catch (error: any) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Add/Remove reaction to message
router.post('/:messageId/reaction', authenticateToken, [
  body('emoji').notEmpty().withMessage('Emoji is required')
], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    // ✅ Verify message exists and user has access
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
      res.status(404).json({ error: 'Message not found or access denied' });
      return;
    }

    // ✅ Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji
      }
    });

    if (existingReaction) {
      // ✅ Remove reaction
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });

      // ✅ Notify chat members
      message.chat.members.forEach(member => {
        try {
          io.to(`user_${member.userId}`).emit('reaction_removed', {
            messageId,
            emoji,
            userId
          });
        } catch (socketError) {
          console.warn('⚠️ Socket notification failed for reaction removal:', member.userId);
        }
      });

      res.json({ 
        message: 'Reaction removed',
        success: true 
      });
    } else {
      // ✅ Add reaction
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        }
      });

      // ✅ Notify chat members
      message.chat.members.forEach(member => {
        try {
          io.to(`user_${member.userId}`).emit('reaction_added', {
            messageId,
            emoji,
            userId
          });
        } catch (socketError) {
          console.warn('⚠️ Socket notification failed for reaction add:', member.userId);
        }
      });

      res.json({ 
        message: 'Reaction added',
        success: true 
      });
    }
  } catch (error: any) {
    console.error('❌ Message reaction error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Search messages in chat
router.get('/chat/:chatId/search', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { q, limit = '20' } = req.query;
    const userId = req.user!.id;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query required' });
      return;
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid limit parameter (1-100)' });
      return;
    }

    // ✅ Verify user is a member of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null
      }
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this chat' });
      return;
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
      take: limitNum
    });

    const formattedMessages = messages.map(formatMessage).filter(msg => msg !== null);

    res.json({ 
      messages: formattedMessages,
      query: q,
      total: formattedMessages.length,
      success: true 
    });
  } catch (error: any) {
    console.error('❌ Search messages error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ✅ Health check endpoint
router.get('/health', (req, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'messages',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;