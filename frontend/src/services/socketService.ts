// frontend/src/services/socketService.ts - Improved connection handling
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

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        this.connectionCallbacks.push(resolve);
        return;
      }

      this.isConnecting = true;
      
      // Use environment variable or fallback
      const serverUrl = process.env.REACT_APP_SOCKET_URL || 'https://justconnect-o8k8.onrender.com';
      
      console.log('🔌 Connecting to socket server:', serverUrl);

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: false, // Don't remember upgrades for better compatibility
        timeout: 60000, // 60 second timeout
        forceNew: false,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        // Add additional options for Render.com
        withCredentials: true,
        extraHeaders: {
          'Origin': window.location.origin
        }
      });

      this.setupEventListeners();

      this.socket.on('connect', () => {
        console.log('🔌 Connected to server successfully');
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

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Connection error:', error);
        this.isConnecting = false;
        
        // Show user-friendly error
        store.dispatch(addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Unable to connect to server. Please check your internet connection.',
        }));
        
        // Retry connection
        this.handleReconnect();
        reject(error);
      });

      // Add timeout for connection attempt
      setTimeout(() => {
        if (this.isConnecting) {
          console.error('🔌 Connection timeout');
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearAllTypingTimeouts();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      
      store.dispatch(addNotification({
        type: 'warning',
        title: 'Disconnected',
        message: 'Connection lost. Attempting to reconnect...',
      }));
      
      if (reason === 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connected successfully:', data);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected successfully after', attemptNumber, 'attempts');
      store.dispatch(addNotification({
        type: 'success',
        title: 'Reconnected',
        message: 'Connection restored successfully',
      }));
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔄 Reconnection failed - max attempts reached');
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to reconnect to server. Please refresh the page.',
      }));
    });

    // Message events
    this.socket.on('new_message', (message: Message) => {
      store.dispatch(addMessage(message));
      store.dispatch(updateChatLastMessage({
        chatId: message.chatId,
        lastMessage: message.content,
        lastMessageAt: message.createdAt
      }));
    });

    this.socket.on('message_delivered', (data: { messageId: string }) => {
      store.dispatch(updateMessageStatus({
        messageId: data.messageId,
        status: 'delivered'
      }));
    });

    this.socket.on('message_read', (data: { messageId: string }) => {
      store.dispatch(updateMessageStatus({
        messageId: data.messageId,
        status: 'read'
      }));
    });

    // Typing events
    this.socket.on('user_typing', (data: { chatId: string; user: any }) => {
      store.dispatch(addUserTyping({ chatId: data.chatId, user: data.user }));
      
      // Auto-remove after 3 seconds
      this.clearTypingTimeout(data.chatId, data.user.id);
      const timeout = setTimeout(() => {
        store.dispatch(removeUserTyping({ chatId: data.chatId, userId: data.user.id }));
      }, 3000);
      this.typingTimeouts.set(`${data.chatId}-${data.user.id}`, timeout);
    });

    this.socket.on('user_stopped_typing', (data: { chatId: string; userId: string }) => {
      store.dispatch(removeUserTyping({ chatId: data.chatId, userId: data.userId }));
      this.clearTypingTimeout(data.chatId, data.userId);
    });

    // Online status events
    this.socket.on('user_online', (data: { userId: string }) => {
      store.dispatch(addOnlineUser(data.userId));
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      store.dispatch(removeOnlineUser(data.userId));
    });

    // Chat events
    this.socket.on('new_chat', (chat: Chat) => {
      store.dispatch(addNewChat(chat));
    });

    this.socket.on('chat_updated', (chat: Chat) => {
      store.dispatch(updateChat(chat));
    });

    // Member events
    this.socket.on('member_added', (data: { chatId: string; user: any }) => {
      store.dispatch(addMember(data));
    });

    this.socket.on('member_removed', (data: { chatId: string; userId: string }) => {
      store.dispatch(removeMember(data));
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    }
  }

  private clearTypingTimeout(chatId: string, userId: string): void {
    const key = `${chatId}-${userId}`;
    const timeout = this.typingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }
  }

  private clearAllTypingTimeouts(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  // Public methods for sending events
  public sendMessage(message: any): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', message);
    }
  }

  public startTyping(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  public stopTyping(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  public markMessagesAsRead(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', { chatId });
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public onConnection(callback: () => void): void {
    if (this.socket?.connected) {
      callback();
    } else {
      this.connectionCallbacks.push(callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;