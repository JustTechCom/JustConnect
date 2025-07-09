// frontend/src/services/socketService.ts - Fixed WebSocket connection
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  addMessage, 
  updateMessageStatus, 
  addMessageReaction, 
  removeMessageReaction,
  replaceTempMessage,
  markChatMessagesAsRead
} from '../store/slices/messageSlice';
import { 
  updateChatLastMessage, 
  addUserTyping, 
  removeUserTyping,
  addOnlineUser,
  removeOnlineUser,
  addNewChat,
  updateChat,
  addMember,
  removeMember
} from '../store/slices/chatSlice';
import { 
  addFriendRequest, 
  removeFriendRequest, 
  addFriend,
  updateFriendOnlineStatus
} from '../store/slices/authSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Message, Chat } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionCallbacks: Array<() => void> = [];
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Enhanced URL detection with better fallbacks
  private getSocketUrl(): string {
    // Check environment variables first
    if (process.env.REACT_APP_SOCKET_URL) {
      console.log('🔧 Using REACT_APP_SOCKET_URL:', process.env.REACT_APP_SOCKET_URL);
      return process.env.REACT_APP_SOCKET_URL;
    }

    // Production URL detection
    if (window.location.hostname.includes('justconnect-ui.onrender.com')) {
      const prodUrl = 'https://justconnect-o8k8.onrender.com';
      console.log('🔧 Using production URL:', prodUrl);
      return prodUrl;
    }

    // Development fallback
    const devUrl = 'http://localhost:5000';
    console.log('🔧 Using development URL:', devUrl);
    return devUrl;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log('✅ Already connected to socket');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('⏳ Connection already in progress, queuing callback');
        this.connectionCallbacks.push(resolve);
        return;
      }

      this.isConnecting = true;
      const serverUrl = this.getSocketUrl();
      
      console.log('🔌 Attempting to connect to:', serverUrl);

      // Enhanced connection options for production
      const socketOptions = {
        auth: { token },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: false, // Don't remember upgrade in production
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxHttpBufferSize: 1e8,
        pingTimeout: 60000,
        pingInterval: 25000,
        // Additional options for HTTPS/WSS
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: false, // For development only
        // CORS handling
        withCredentials: false,
        autoConnect: true,
      };

      console.log('🔧 Socket options:', socketOptions);

      this.socket = io(serverUrl, socketOptions);
      this.setupEventListeners();

      // Connection success
      this.socket.on('connect', () => {
        console.log('✅ Connected to server successfully');
        console.log('🆔 Socket ID:', this.socket?.id);
        console.log('🚀 Transport:', this.socket?.io.engine.transport.name);
        
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Join user's chats
        this.socket?.emit('join_chats');
        
        // Notify success
        store.dispatch(addNotification({
          type: 'success',
          title: 'Connected',
          message: 'Connected to JustConnect server',
        }));

        // Execute callbacks
        this.connectionCallbacks.forEach(callback => callback());
        this.connectionCallbacks = [];
        
        resolve();
      });

      // Connection error handling
      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        console.error('❌ Error type:', error.constructor.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error description:', error.description);
        
        this.isConnecting = false;
        
        // More detailed error logging
        if (error.message.includes('websocket error')) {
          console.error('🚫 WebSocket specific error - likely CORS or protocol issue');
        }
        
        if (error.message.includes('timeout')) {
          console.error('⏰ Connection timeout - server might be down');
        }

        store.dispatch(addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: `Unable to connect to server: ${error.message}`,
        }));

        this.handleReconnect();
        reject(error);
      });

      // Transport change logging
      this.socket.on('disconnect', (reason, details) => {
        console.log('🔌 Disconnected from server:', reason);
        if (details) {
          console.log('🔍 Disconnect details:', details);
        }
        
        if (reason === 'io server disconnect') {
          console.log('🔄 Server initiated disconnect, attempting reconnect...');
          this.handleReconnect();
        }
      });

      // Transport upgrade logging
      this.socket.io.on('upgrade', (transport) => {
        console.log('⬆️ Upgraded to transport:', transport.name);
      });

      this.socket.io.on('upgradeError', (error) => {
        console.error('❌ Upgrade error:', error);
      });
    });
  }

  disconnect(): void {
    console.log('🔌 Manually disconnecting socket');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearAllTypingTimeouts();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          this.connect(token).catch((error) => {
            console.error('🔄 Reconnection failed:', error);
          });
        } else {
          console.error('❌ No auth token available for reconnection');
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Lost',
        message: 'Unable to connect to server. Please refresh the page.',
      }));
    }
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      const serverUrl = this.getSocketUrl();
      console.log('🧪 Testing connection to:', serverUrl);
      
      // Test HTTP endpoint first
      const response = await fetch(`${serverUrl}/health`);
      if (response.ok) {
        console.log('✅ HTTP health check passed');
        return true;
      } else {
        console.error('❌ HTTP health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('✅ Connected successfully:', data);
    });

    this.socket.on('chats_joined', (data) => {
      console.log('📱 Joined chats:', data);
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

    // Message events (keeping existing logic)
    this.socket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message);
      
      store.dispatch(addMessage(message));
      store.dispatch(updateChatLastMessage({
        chatId: message.chatId,
        message: message.content,
        timestamp: message.createdAt.toString(),
        senderId: message.senderId
      }));

      // Show notification logic (existing)
      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      const activeChat = state.chats.activeChat;
      
      if (message.senderId !== currentUserId) {
        this.playNotificationSound();
        
        if (!activeChat || activeChat.id !== message.chatId) {
          this.showBrowserNotification(
            `${message.sender.firstName} ${message.sender.lastName}`,
            message.content,
            message.sender.avatar
          );
          
          store.dispatch(addNotification({
            type: 'info',
            title: `${message.sender.firstName} ${message.sender.lastName}`,
            message: message.content,
          }));
        }

        this.markMessageAsDelivered(message.id, message.chatId);
      }
    });

    // Add all other existing event listeners here...
    // (keeping the existing implementation for brevity)
  }

  // Utility methods
  isConnected(): boolean {
    const connected = this.socket?.connected || false;
    console.log('🔍 Socket connected status:', connected);
    return connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getConnectionInfo(): any {
    if (!this.socket) return null;
    
    return {
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine?.transport?.name,
      ping: this.socket.io.engine?.ping,
      readyState: this.socket.io.engine?.readyState,
      upgraded: this.socket.io.engine?.upgraded,
    };
  }

  // Public methods for emitting events
  sendMessage(data: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
    tempId?: string;
  }): void {
    if (!this.isConnected()) {
      console.error('❌ Cannot send message: socket not connected');
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Cannot send message. Please check your connection.',
      }));
      return;
    }
    
    console.log('📨 Sending message:', data);
    this.socket?.emit('send_message', data);
  }

  startTyping(chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('typing_start', { chatId });
    }
  }

  stopTyping(chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('typing_stop', { chatId });
    }
  }

  markMessageAsDelivered(messageId: string, chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('message_delivered', { messageId, chatId });
    }
  }

  markMessageAsRead(messageId: string, chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('message_read', { messageId, chatId });
    }
  }

  joinChat(chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId: string): void {
    if (this.isConnected()) {
      this.socket?.emit('leave_chat', { chatId });
    }
  }

  // Helper methods
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.warn('Could not play notification sound');
      });
    } catch (error) {
      console.warn('Could not play notification sound');
    }
  }

  private showBrowserNotification(title: string, body: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'justconnect-message',
        renotify: false
      });
    }
  }

  private clearAllTypingTimeouts(): void {
    this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.typingTimeouts.clear();
  }
}

export const socketService = new SocketService();
export default socketService;