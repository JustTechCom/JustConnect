// backend/src/services/socketService.ts - Enhanced real-time functionality
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

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
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
    console.log(`🔌 User ${userId} connected with socket ${socket.id}`);

    try {
      // Track connection
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId)!.add(socket.id);
      socketToUser.set(socket.id, userId);

      // Set user online
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: true, 
          lastSeen: new Date() 
        }
      });

      // Store in Redis for scaling
      if (redis) {
        await redis.sadd('online_users', userId);
        await redis.hset(`user_socket:${userId}`, socket.id, Date.now());
      }

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Get user's chats and join them
      const userChats = await prisma.chatMember.findMany({
        where: { 
          userId,
          leftAt: null 
        },
        select: { chatId: true }
      });

      userChats.forEach(({ chatId }) => {
        socket.join(`chat_${chatId}`);
      });

      // Notify friends that user is online
      await notifyFriendsOnlineStatus(userId, true);

      // Send initial data
      socket.emit('connected', {
        userId,
        socketId: socket.id,
        timestamp: new Date()
      });

      // Join chats handler
      socket.on('join_chats', async () => {
        try {
          const chats = await prisma.chatMember.findMany({
            where: { 
              userId,
              leftAt: null 
            },
            include: { 
              chat: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              }
            }
          });

          chats.forEach(({ chat }) => {
            socket.join(`chat_${chat.id}`);
          });

          socket.emit('chats_joined', {
            count: chats.length,
            chats: chats.map(c => c.chat)
          });

          console.log(`📱 User ${userId} joined ${chats.length} chats`);
        } catch (error) {
          console.error('Join chats error:', error);
          socket.emit('error', { message: 'Failed to join chats' });
        }
      });

      // Send message handler
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, type = 'TEXT', replyTo, tempId } = data;

          // Validate input
          if (!chatId || !content?.trim()) {
            socket.emit('error', { message: 'Chat ID and content are required' });
            return;
          }

          // Verify membership
          const membership = await prisma.chatMember.findFirst({
            where: {
              chatId,
              userId,
              leftAt: null
            }
          });

          if (!membership) {
            socket.emit('error', { message: 'You are not a member of this chat' });
            return;
          }

          // Create message
          const message = await prisma.message.create({
            data: {
              content: content.trim(),
              type,
              chatId,
              senderId: userId,
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
              lastMessage: type === 'TEXT' ? content.trim() : `${type.toLowerCase()} message`,
              lastMessageAt: new Date()
            }
          });

          // Send to all chat members
          io.to(`chat_${chatId}`).emit('new_message', message);

          // Send confirmation to sender with tempId for client mapping
          socket.emit('message_sent', {
            tempId,
            message
          });

          // Cache message for quick retrieval
          if (redis) {
            await redis.lpush(`chat_messages_${chatId}`, JSON.stringify(message));
            await redis.ltrim(`chat_messages_${chatId}`, 0, 99); // Keep last 100 messages
          }

          console.log(`📨 Message sent in chat ${chatId} by user ${userId}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('typing_start', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) return;

          // Verify membership
          const membership = await prisma.chatMember.findFirst({
            where: {
              chatId,
              userId,
              leftAt: null
            }
          });

          if (!membership) return;

          // Store typing status in Redis with expiration
          if (redis) {
            await redis.setex(`typing:${chatId}:${userId}`, 10, Date.now());
          }

          // Notify other chat members
          socket.to(`chat_${chatId}`).emit('user_typing', {
            userId,
            chatId,
            user: socket.userData
          });

          console.log(`⌨️ User ${userId} started typing in chat ${chatId}`);
        } catch (error) {
          console.error('Typing start error:', error);
        }
      });

      socket.on('typing_stop', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) return;

          // Remove typing status from Redis
          if (redis) {
            await redis.del(`typing:${chatId}:${userId}`);
          }

          // Notify other chat members
          socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
            userId,
            chatId
          });

          console.log(`⌨️ User ${userId} stopped typing in chat ${chatId}`);
        } catch (error) {
          console.error('Typing stop error:', error);
        }
      });

      // Message status updates
      socket.on('message_delivered', async (data) => {
        try {
          const { messageId, chatId } = data;

          await prisma.message.update({
            where: { id: messageId },
            data: { delivered: true }
          });

          socket.to(`chat_${chatId}`).emit('message_status_updated', {
            messageId,
            chatId,
            status: 'delivered',
            userId
          });
        } catch (error) {
          console.error('Message delivered error:', error);
        }
      });

      socket.on('message_read', async (data) => {
        try {
          const { messageId, chatId } = data;

          const message = await prisma.message.update({
            where: { id: messageId },
            data: { 
              read: true,
              delivered: true 
            },
            select: { senderId: true }
          });

          // Notify sender
          io.to(`user_${message.senderId}`).emit('message_status_updated', {
            messageId,
            chatId,
            status: 'read',
            readBy: userId
          });
        } catch (error) {
          console.error('Message read error:', error);
        }
      });

      // Join specific chat
      socket.on('join_chat', async (data) => {
        try {
          const { chatId } = data;

          // Verify membership
          const membership = await prisma.chatMember.findFirst({
            where: {
              chatId,
              userId,
              leftAt: null
            }
          });

          if (membership) {
            socket.join(`chat_${chatId}`);
            socket.emit('chat_joined', { chatId });
          } else {
            socket.emit('error', { message: 'Not a member of this chat' });
          }
        } catch (error) {
          console.error('Join chat error:', error);
        }
      });

      // Leave specific chat
      socket.on('leave_chat', (data) => {
        const { chatId } = data;
        socket.leave(`chat_${chatId}`);
        socket.emit('chat_left', { chatId });
      });

      // Handle friend requests
      socket.on('send_friend_request', async (data) => {
        try {
          const { targetUserId } = data;

          if (targetUserId === userId) {
            socket.emit('error', { message: 'Cannot send friend request to yourself' });
            return;
          }

          // Check if request already exists
          const existingRequest = await prisma.friendship.findFirst({
            where: {
              OR: [
                { requesterId: userId, addresseeId: targetUserId },
                { requesterId: targetUserId, addresseeId: userId }
              ]
            }
          });

          if (existingRequest) {
            socket.emit('error', { message: 'Friend request already exists' });
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
                  avatar: true,
                  username: true
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

      // Call events (for future implementation)
      socket.on('initiate_call', async (data) => {
        try {
          const { targetUserId, callType } = data; // 'audio' or 'video'
          
          // Create call session
          const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Store call info in Redis
          if (redis) {
            await redis.setex(`call:${callId}`, 300, JSON.stringify({
              callerId: userId,
              targetId: targetUserId,
              type: callType,
              status: 'ringing',
              createdAt: Date.now()
            }));
          }

          // Notify target user
          io.to(`user_${targetUserId}`).emit('incoming_call', {
            callId,
            caller: socket.userData,
            type: callType
          });

          socket.emit('call_initiated', { callId });
        } catch (error) {
          console.error('Initiate call error:', error);
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

              // Remove from Redis
              if (redis) {
                await redis.srem('online_users', userId);
                await redis.del(`user_socket:${userId}`);
              }

              // Notify friends user is offline
              await notifyFriendsOnlineStatus(userId, false);
            } else {
              // Remove specific socket from Redis
              if (redis) {
                await redis.hdel(`user_socket:${userId}`, socket.id);
              }
            }
          }

          socketToUser.delete(socket.id);

          // Clear typing status
          if (redis) {
            const typingKeys = await redis.keys(`typing:*:${userId}`);
            if (typingKeys.length > 0) {
              await redis.del(...typingKeys);
            }
          }

        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

      // Error handler
      socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error);
      });

    } catch (error) {
      console.error('Socket connection setup error:', error);
      socket.emit('error', { message: 'Connection setup failed' });
      socket.disconnect();
    }
  });
};

// Helper function to notify friends about online status
async function notifyFriendsOnlineStatus(userId: string, isOnline: boolean) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' }
        ]
      },
      select: {
        requesterId: true,
        addresseeId: true
      }
    });

    const friendIds = friendships.map(f => 
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Notify each friend
    friendIds.forEach(friendId => {
      if (activeConnections.has(friendId)) {
        const socketIds = activeConnections.get(friendId)!;
        socketIds.forEach(socketId => {
          const io = require('../app').io;
          io.to(socketId).emit('friend_status_changed', {
            userId,
            isOnline,
            timestamp: new Date()
          });
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

export const broadcastToUser = (userId: string, event: string, data: any) => {
  const io = require('../app').io;
  io.to(`user_${userId}`).emit(event, data);
};

export const broadcastToChat = (chatId: string, event: string, data: any) => {
  const io = require('../app').io;
  io.to(`chat_${chatId}`).emit(event, data);
};