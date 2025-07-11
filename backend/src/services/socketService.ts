// backend/src/services/socketService.ts - Complete socket service with proper exports
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userData?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// Store active connections
const activeConnections = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketToUser = new Map<string, string>(); // socketId -> userId

export const setupSocketHandlers = (io: Server): void => {
  console.log('🔌 Setting up socket handlers...');

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.id || decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          banned: true
        }
      });

      if (!user || user.banned) {
        return next(new Error('User not found or banned'));
      }

      socket.userId = user.id;
      socket.userData = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userData = socket.userData!;

    console.log(`🔌 User ${userData.firstName} ${userData.lastName} connected (${userId})`);

    try {
      // Track connection
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId)!.add(socket.id);
      socketToUser.set(socket.id, userId);

      // Join user's personal room
      socket.join(`user_${userId}`);

      // Set user online in database
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: true,
          lastSeen: new Date()
        }
      });

      // Get user's chats and join them
      const userChats = await prisma.chatMember.findMany({
        where: { userId },
        select: { chatId: true }
      });

      userChats.forEach(({ chatId }) => {
        socket.join(`chat_${chatId}`);
      });

      // Emit successful connection
      socket.emit('connected', {
        message: 'Connected successfully',
        user: userData,
        timestamp: new Date()
      });

      // Notify friends about online status
      await notifyFriendsOnlineStatus(userId, true);

    } catch (error) {
      console.error('Connection setup error:', error);
      socket.emit('error', { message: 'Connection setup failed' });
    }

    // Join chats handler
    socket.on('join_chats', async () => {
      try {
        const userChats = await prisma.chatMember.findMany({
          where: { userId },
          select: { chatId: true }
        });

        userChats.forEach(({ chatId }) => {
          socket.join(`chat_${chatId}`);
        });

        console.log(`📱 User ${userId} joined ${userChats.length} chats`);
      } catch (error) {
        console.error('Join chats error:', error);
      }
    });

    // Send message handler
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'TEXT', replyTo, tempId } = data;

        console.log(`📤 Message from ${userId} to chat ${chatId}: ${content}`);

        // Verify user is member of chat
        const membership = await prisma.chatMember.findFirst({
          where: { chatId, userId }
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this chat' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            type,
            chatId,
            senderId: userId,
            replyTo: replyTo || undefined
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            replyToMessage: replyTo ? {
              select: {
                id: true,
                content: true,
                sender: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            } : false
          }
        });

        // Update chat's last message
        await prisma.chat.update({
          where: { id: chatId },
          data: {
            lastMessage: content,
            lastMessageAt: new Date()
          }
        });

        // Broadcast to chat members
        io.to(`chat_${chatId}`).emit('new_message', message);

        // Send confirmation to sender
        socket.emit('message_sent', { tempId, message });

        // Cache message for quick retrieval
        if (redis) {
          await redis.setex(
            `message:${message.id}`,
            3600, // 1 hour
            JSON.stringify(message)
          );
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing events
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        user: userData
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
        chatId,
        userId
      });
    });

    // Message status handlers
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId } = data;

        // Update unread messages to read
        const updatedMessages = await prisma.message.updateMany({
          where: {
            chatId,
            senderId: { not: userId },
            read: false
          },
          data: { read: true }
        });

        if (updatedMessages.count > 0) {
          // Notify chat about read status
          socket.to(`chat_${chatId}`).emit('messages_read', {
            chatId,
            readBy: userId,
            messageCount: updatedMessages.count
          });
        }

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Join specific chat
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        // Verify membership
        const membership = await prisma.chatMember.findFirst({
          where: { chatId, userId }
        });

        if (membership) {
          socket.join(`chat_${chatId}`);
          console.log(`📱 User ${userId} joined chat ${chatId}`);
        }
      } catch (error) {
        console.error('Join chat error:', error);
      }
    });

    // Leave specific chat
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      console.log(`👋 User ${userId} left chat ${chatId}`);
    });

    // Friend request handlers
    socket.on('send_friend_request', async (data) => {
      try {
        const { targetUserId } = data;

        if (targetUserId === userId) {
          socket.emit('error', { message: 'Cannot send friend request to yourself' });
          return;
        }

        // Check if already friends or request exists
        const existingRelation = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: userId, addresseeId: targetUserId },
              { requesterId: targetUserId, addresseeId: userId }
            ]
          }
        });

        if (existingRelation) {
          socket.emit('error', { message: 'Friend request already exists or you are already friends' });
          return;
        }

        // Create friend request
        const friendship = await prisma.friendship.create({
          data: {
            requesterId: userId,
            addresseeId: targetUserId,
            status: 'PENDING'
          },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });

        // Notify target user
        io.to(`user_${targetUserId}`).emit('friend_request_received', {
          friendship,
          requester: friendship.requester
        });

        socket.emit('friend_request_sent', { friendship });

      } catch (error) {
        console.error('Send friend request error:', error);
        socket.emit('error', { message: 'Failed to send friend request' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', async (reason) => {
      try {
        console.log(`🔌 User ${userId} disconnected: ${reason}`);

        // Remove from tracking
        if (activeConnections.has(userId)) {
          activeConnections.get(userId)!.delete(socket.id);
          if (activeConnections.get(userId)!.size === 0) {
            activeConnections.delete(userId);
            
            // Set user offline if no more connections
            await prisma.user.update({
              where: { id: userId },
              data: { 
                isOnline: false,
                lastSeen: new Date()
              }
            });

            // Notify friends about offline status
            await notifyFriendsOnlineStatus(userId, false);
          }
        }

        socketToUser.delete(socket.id);

      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // Error handler
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('✅ Socket handlers setup complete');
};

// Helper function to notify friends about online status
async function notifyFriendsOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    const friendIds = friendships.map(f => 
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Notify each online friend
    friendIds.forEach(friendId => {
      if (activeConnections.has(friendId)) {
        const io = require('../app').io;
        io.to(`user_${friendId}`).emit('friend_status_changed', {
          userId,
          isOnline,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Notify friends online status error:', error);
  }
}

// Utility functions for external use
export const getActiveUsers = (): string[] => {
  return Array.from(activeConnections.keys());
};

export const isUserOnline = (userId: string): boolean => {
  return activeConnections.has(userId);
};

export const getUserSocketIds = (userId: string): string[] => {
  return Array.from(activeConnections.get(userId) || []);
};

export const broadcastToUser = (userId: string, event: string, data: any): void => {
  const io = require('../app').io;
  io.to(`user_${userId}`).emit(event, data);
};

export const broadcastToChat = (chatId: string, event: string, data: any): void => {
  const io = require('../app').io;
  io.to(`chat_${chatId}`).emit(event, data);
};

// Default export for convenience
export default { setupSocketHandlers };