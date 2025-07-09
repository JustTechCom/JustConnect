// backend/src/services/socketService.ts - Fixed version
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string; // Changed from string | null to string | undefined
  };
}

interface TypingUser {
  userId: string;
  socketId: string;
  chatId: string;
  timestamp: Date;
}

interface MessageData {
  chatId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION';
  replyTo?: string;
  tempId?: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private typingUsers: Map<string, TypingUser> = new Map(); // socketId -> TypingUser
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // socketId -> timeout

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Fetch user details
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
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
        socket.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar || undefined // Fixed: Convert null to undefined
        };

        // Update user online status
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true, lastSeen: new Date() }
        });

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ User ${socket.userId} connected`);
      
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        this.broadcastUserOnline(socket.userId);
      }

      // Join user's chats
      socket.on('join_chats', async () => {
        try {
          if (!socket.userId) return;

          const userChats = await prisma.chatMember.findMany({
            where: { userId: socket.userId },
            select: { chatId: true }
          });

          for (const chat of userChats) {
            socket.join(`chat:${chat.chatId}`);
          }

          socket.emit('chats_joined', { 
            success: true, 
            chatCount: userChats.length 
          });

          console.log(`📱 User ${socket.userId} joined ${userChats.length} chats`);
        } catch (error) {
          console.error('Error joining chats:', error);
          socket.emit('error', { message: 'Failed to join chats' });
        }
      });

      // Join specific chat
      socket.on('join_chat', ({ chatId }) => {
        socket.join(`chat:${chatId}`);
        console.log(`📱 User ${socket.userId} joined chat ${chatId}`);
      });

      // Leave specific chat
      socket.on('leave_chat', ({ chatId }) => {
        socket.leave(`chat:${chatId}`);
        console.log(`📱 User ${socket.userId} left chat ${chatId}`);
      });

      // Handle new message
      socket.on('send_message', async (data: MessageData) => {
        try {
          if (!socket.userId) return;

          // Validate chat membership
          const membership = await prisma.chatMember.findFirst({
            where: {
              chatId: data.chatId,
              userId: socket.userId
            }
          });

          if (!membership) {
            socket.emit('error', { message: 'You are not a member of this chat' });
            return;
          }

          // Create message in database
          const message = await prisma.message.create({
            data: {
              content: data.content,
              type: data.type || 'TEXT',
              chatId: data.chatId,
              senderId: socket.userId,
              replyTo: data.replyTo || null
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
                      username: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          });

          // Update chat's last message
          await prisma.chat.update({
            where: { id: data.chatId },
            data: { updatedAt: new Date() }
          });

          // Stop typing for this user
          this.handleStopTyping(socket, data.chatId);

          // Broadcast to chat members
          this.io.to(`chat:${data.chatId}`).emit('new_message', message);

          // Send confirmation to sender
          socket.emit('message_sent', { 
            message, 
            tempId: data.tempId 
          });

          console.log(`📨 Message sent by ${socket.userId} in chat ${data.chatId}`);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing events
      socket.on('typing_start', ({ chatId }) => {
        this.handleStartTyping(socket, chatId);
      });

      socket.on('typing_stop', ({ chatId }) => {
        this.handleStopTyping(socket, chatId);
      });

      // Handle message status updates
      socket.on('message_delivered', async ({ messageId, chatId }) => {
        try {
          if (!socket.userId) return;

          // Update message delivery status
          await prisma.message.update({
            where: { id: messageId },
            data: { delivered: true }
          });

          // Notify sender
          socket.to(`chat:${chatId}`).emit('message_status_updated', {
            messageId,
            chatId,
            status: 'delivered',
            deliveredBy: socket.userId
          });
        } catch (error) {
          console.error('Error updating message delivery:', error);
        }
      });

      socket.on('message_read', async ({ messageId, chatId }) => {
        try {
          if (!socket.userId) return;

          // Update message read status
          await prisma.message.update({
            where: { id: messageId },
            data: { 
              read: true,
              delivered: true 
            }
          });

          // Notify sender
          socket.to(`chat:${chatId}`).emit('message_status_updated', {
            messageId,
            chatId,
            status: 'read',
            readBy: socket.userId
          });
        } catch (error) {
          console.error('Error updating message read status:', error);
        }
      });

      // Handle friend requests
      socket.on('send_friend_request', async ({ targetUserId }) => {
        try {
          if (!socket.userId) return;

          const targetSocketId = this.connectedUsers.get(targetUserId);
          if (targetSocketId && socket.user) {
            this.io.to(targetSocketId).emit('friend_request_received', {
              requester: socket.user,
              requesterId: socket.userId
            });
          }
        } catch (error) {
          console.error('Error sending friend request notification:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`❌ User ${socket.userId} disconnected`);
        
        if (socket.userId) {
          // Remove from connected users
          this.connectedUsers.delete(socket.userId);
          
          // Clear typing status
          this.clearAllTypingForUser(socket);
          
          // Update user offline status
          await prisma.user.update({
            where: { id: socket.userId },
            data: { isOnline: false, lastSeen: new Date() }
          }).catch(console.error);

          // Broadcast user offline
          this.broadcastUserOffline(socket.userId);
        }
      });

      // Emit connected event
      socket.emit('connected', { 
        success: true, 
        userId: socket.userId,
        user: socket.user 
      });
    });
  }

  private handleStartTyping(socket: AuthenticatedSocket, chatId: string) {
    if (!socket.userId) return;

    const typingKey = `${socket.id}:${chatId}`;
    
    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(typingKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to typing users
    this.typingUsers.set(typingKey, {
      userId: socket.userId,
      socketId: socket.id,
      chatId,
      timestamp: new Date()
    });

    // Broadcast typing status
    socket.to(`chat:${chatId}`).emit('user_typing', {
      userId: socket.userId,
      chatId,
      user: socket.user
    });

    // Set auto-stop timeout (10 seconds)
    const timeout = setTimeout(() => {
      this.handleStopTyping(socket, chatId);
    }, 10000);

    this.typingTimeouts.set(typingKey, timeout);
  }

  private handleStopTyping(socket: AuthenticatedSocket, chatId: string) {
    if (!socket.userId) return;

    const typingKey = `${socket.id}:${chatId}`;
    
    // Clear timeout
    const existingTimeout = this.typingTimeouts.get(typingKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(typingKey);
    }

    // Remove from typing users
    if (this.typingUsers.has(typingKey)) {
      this.typingUsers.delete(typingKey);
      
      // Broadcast stop typing
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId
      });
    }
  }

  private clearAllTypingForUser(socket: AuthenticatedSocket) {
    const userTypingKeys = Array.from(this.typingUsers.keys())
      .filter(key => key.startsWith(socket.id));

    for (const key of userTypingKeys) {
      const typingUser = this.typingUsers.get(key);
      if (typingUser) {
        // Clear timeout
        const timeout = this.typingTimeouts.get(key);
        if (timeout) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(key);
        }

        // Remove from typing
        this.typingUsers.delete(key);

        // Broadcast stop typing
        socket.to(`chat:${typingUser.chatId}`).emit('user_stopped_typing', {
          userId: typingUser.userId,
          chatId: typingUser.chatId
        });
      }
    }
  }

  private broadcastUserOnline(userId: string) {
    this.io.emit('user_online', userId);
  }

  private broadcastUserOffline(userId: string) {
    this.io.emit('user_offline', userId);
  }

  // Public methods for external use
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public sendToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  public getTypingUsersInChat(chatId: string): TypingUser[] {
    return Array.from(this.typingUsers.values())
      .filter(user => user.chatId === chatId);
  }
}

export default SocketService;