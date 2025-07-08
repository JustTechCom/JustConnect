import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageStatus } from '../store/slices/messageSlice';
import { 
  updateChatLastMessage, 
  addUserTyping, 
  removeUserTyping,
  addOnlineUser,
  removeOnlineUser 
} from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Message, SocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.reconnectAttempts = 0;
      
      // Join user's chats
      this.socket?.emit('join_chats');
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Connected to JustConnect server',
      }));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('new_message', (message: Message) => {
      console.log('📨 New message:', message);
      
      store.dispatch(addMessage(message));
      store.dispatch(updateChatLastMessage({
        chatId: message.chatId,
        message: message.content,
        timestamp: message.createdAt.toString(),
      }));

      // Show notification if not from current user
      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      
      if (message.senderId !== currentUserId) {
        const isCurrentChat = state.chats.activeChat?.id === message.chatId;
        
        if (!isCurrentChat) {
          store.dispatch(addNotification({
            type: 'info',
            title: `${message.sender.firstName} ${message.sender.lastName}`,
            message: message.content,
          }));
        }

        // Play notification sound
        this.playNotificationSound();
      }
    });

    this.socket.on('message_status_updated', (data: { messageId: string; status: string; chatId: string }) => {
      store.dispatch(updateMessageStatus({
        messageId: data.messageId,
        chatId: data.chatId,
        status: data.status as 'sent' | 'delivered' | 'read',
      }));
    });

    // Typing events
    this.socket.on('user_typing', (data: { userId: string; chatId: string }) => {
      store.dispatch(addUserTyping(data));
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; chatId: string }) => {
      store.dispatch(removeUserTyping(data));
    });

    // Online status events
    this.socket.on('user_online', (userId: string) => {
      store.dispatch(addOnlineUser(userId));
    });

    this.socket.on('user_offline', (userId: string) => {
      store.dispatch(removeOnlineUser(userId));
    });

    // Error events
    this.socket.on('error', (data: { message: string }) => {
      console.error('🚨 Socket error:', data.message);
      store.dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: data.message,
      }));
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          this.connect(token);
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Lost',
        message: 'Unable to connect to server. Please refresh the page.',
      }));
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  }

  // Public methods for emitting events
  sendMessage(data: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }): void {
    this.socket?.emit('send_message', data);
  }

  startTyping(chatId: string): void {
    this.socket?.emit('typing_start', { chatId });
  }

  stopTyping(chatId: string): void {
    this.socket?.emit('typing_stop', { chatId });
  }

  markMessageAsDelivered(messageId: string, chatId: string): void {
    this.socket?.emit('message_delivered', { messageId, chatId });
  }

  markMessageAsRead(messageId: string, chatId: string): void {
    this.socket?.emit('message_read', { messageId, chatId });
  }

  joinChat(chatId: string): void {
    this.socket?.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string): void {
    this.socket?.emit('leave_chat', { chatId });
  }

  // Voice/Video call events (for future implementation)
  initiateCall(targetUserId: string, callType: 'audio' | 'video'): void {
    this.socket?.emit('initiate_call', { targetUserId, callType });
  }

  acceptCall(callId: string): void {
    this.socket?.emit('accept_call', { callId });
  }

  rejectCall(callId: string): void {
    this.socket?.emit('reject_call', { callId });
  }

  endCall(callId: string): void {
    this.socket?.emit('end_call', { callId });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;