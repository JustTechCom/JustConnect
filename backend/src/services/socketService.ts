import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      socket.userId = decoded.userId;
      
      // Set user online
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { isOnline: true, lastSeen: new Date() }
      });
      
      if (redis) {
        await redis.sadd('online_users', decoded.userId);
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their chats
    socket.on('join_chats', async () => {
      try {
        const chats = await prisma.chatMember.findMany({
          where: { userId: socket.userId },
          include: { chat: true }
        });

        chats.forEach(({ chat }) => {
          socket.join(`chat_${chat.id}`);
        });

        console.log(`User ${socket.userId} joined ${chats.length} chats`);
      } catch (error) {
        console.error('Join chats error:', error);
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            type: data.type || 'TEXT',
            chatId: data.chatId,
            senderId: socket.userId!,
            replyTo: data.replyTo
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
          where: { id: data.chatId },
          data: {
            lastMessage: data.content,
            lastMessageAt: new Date()
          }
        });

        // Emit to chat members
        io.to(`chat_${data.chatId}`).emit('new_message', message);

        // Cache message for quick retrieval
        if (redis) {
          await redis.lpush(`chat_messages_${data.chatId}`, JSON.stringify(message));
          await redis.ltrim(`chat_messages_${data.chatId}`, 0, 99);
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    // Message status updates
    socket.on('message_delivered', async (data) => {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: { delivered: true }
        });

        socket.to(`chat_${data.chatId}`).emit('message_status_updated', {
          messageId: data.messageId,
          status: 'delivered'
        });
      } catch (error) {
        console.error('Message delivered error:', error);
      }
    });

    socket.on('message_read', async (data) => {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: { read: true }
        });

        socket.to(`chat_${data.chatId}`).emit('message_status_updated', {
          messageId: data.messageId,
          status: 'read'
        });
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isOnline: false, lastSeen: new Date() }
        });
        
        if (redis) {
          await redis.srem('online_users', socket.userId!);
        }
        
        console.log(`User ${socket.userId} disconnected`);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};