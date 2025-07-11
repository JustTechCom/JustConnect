// frontend/src/services/socketService.ts - Real-time Socket Communication
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, markMessageAsDelivered, markMessageAsRead } from '../store/slices/messageSlice';
import { 
  setUserOnline, 
  setUserTyping, 
  setUserStoppedTyping, 
  updateLastMessage 
} from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/uiSlice';

interface MessageData {
  chatId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION';
  replyTo?: string;
}

interface TypingData {
  chatId: string;
  userId?: string;
  username?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(token: string): void {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('reconnect', this.handleReconnect.bind(this));
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt.bind(this));
    this.socket.on('reconnect_error', this.handleReconnectError.bind(this));

    // Message events
    this.socket.on('new_message', this.handleNewMessage.bind(this));
    this.socket.on('message_delivered', this.handleMessageDelivered.bind(this));
    this.socket.on('message_read', this.handleMessageRead.bind(this));
    this.socket.on('message_edited', this.handleMessageEdited.bind(this));
    this.socket.on('message_deleted', this.handleMessageDeleted.bind(this));

    // Typing events
    this.socket.on('user_typing', this.handleUserTyping.bind(this));
    this.socket.on('user_stopped_typing', this.handleUserStoppedTyping.bind(this));

    // Presence events
    this.socket.on('user_online', this.handleUserOnline.bind(this));
    this.socket.on('user_offline', this.handleUserOffline.bind(this));

    // Chat events
    this.socket.on('chat_created', this.handleChatCreated.bind(this));
    this.socket.on('chat_updated', this.handleChatUpdated.bind(this));
    this.socket.on('chat_deleted', this.handleChatDeleted.bind(this));

    // Error handling
    this.socket.on('error', this.handleError.bind(this));
  }

  private handleConnect(): void {
    console.log('✅ Socket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Join user's chats
    this.joinChats();

    // Notify success
    store.dispatch(addNotification({
      type: 'success',
      title: 'Connected',
      message: 'Real-time connection established',
    }));
  }

  private handleDisconnect(reason: string): void {
    console.log('❌ Socket disconnected:', reason);
    this.isConnected = false;

    if (reason === 'io server disconnect') {
      // Server forcefully disconnected, attempt to reconnect
      this.attemptReconnect();
    }

    store.dispatch(addNotification({
      type: 'warning',
      title: 'Connection Lost',
      message: 'Attempting to reconnect...',
    }));
  }

  private handleConnectError(error: Error): void {
    console.error('❌ Socket connection error:', error);
    this.isConnected = false;
    this.attemptReconnect();
  }

  private handleReconnect(): void {
    console.log('🔄 Socket reconnected');
    this.handleConnect();
  }

  private handleReconnectAttempt(attempt: number): void {
    console.log(`🔄 Reconnect attempt ${attempt}`);
    this.reconnectAttempts = attempt;
  }

  private handleReconnectError(error: Error): void {
    console.error('❌ Reconnect error:', error);
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to server. Please refresh the page.',
      }));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Message handlers
  private handleNewMessage(message: any): void {
    console.log('📨 New message received:', message);
    
    store.dispatch(addMessage(message));
    store.dispatch(updateLastMessage({
      chatId: message.chatId,
      message: message.content,
      timestamp: new Date(message.createdAt),
      incrementUnread: true,
    }));

    // Show notification if not in active chat
    const state = store.getState();
    const activeChat = state.chats.activeChat;
    
    if (!activeChat || activeChat.id !== message.chatId) {
      store.dispatch(addNotification({
        type: 'info',
        title: `${message.sender.firstName} ${message.sender.lastName}`,
        message: message.content,
      }));
    }
  }

  private handleMessageDelivered(data: { messageId: string }): void {
    console.log('✅ Message delivered:', data.messageId);
    store.dispatch(markMessageAsDelivered(data.messageId));
  }

  private handleMessageRead(data: { messageId: string }): void {
    console.log('👁️ Message read:', data.messageId);
    store.dispatch(markMessageAsRead(data.messageId));
  }

  private handleMessageEdited(data: any): void {
    console.log('✏️ Message edited:', data);
    // Handle message edit
  }

  private handleMessageDeleted(data: { messageId: string }): void {
    console.log('🗑️ Message deleted:', data.messageId);
    // Handle message deletion
  }

  // Typing handlers
  private handleUserTyping(data: TypingData): void {
    console.log('⌨️ User typing:', data);
    store.dispatch(setUserTyping({
      chatId: data.chatId,
      userId: data.userId || '',
      username: data.username || 'Someone',
    }));
  }

  private handleUserStoppedTyping(data: TypingData): void {
    console.log('⏹️ User stopped typing:', data);
    store.dispatch(setUserStoppedTyping({
      chatId: data.chatId,
      userId: data.userId || '',
      username: data.username || 'Someone',
    }));
  }

  // Presence handlers
  private handleUserOnline(data: { userId: string }): void {
    console.log('🟢 User online:', data.userId);
    store.dispatch(setUserOnline({ userId: data.userId, isOnline: true }));
  }

  private handleUserOffline(data: { userId: string }): void {
    console.log('⚫ User offline:', data.userId);
    store.dispatch(setUserOnline({ userId: data.userId, isOnline: false }));
  }

  // Chat handlers
  private handleChatCreated(chat: any): void {
    console.log('💬 Chat created:', chat);
    // Handle new chat creation
  }

  private handleChatUpdated(chat: any): void {
    console.log('📝 Chat updated:', chat);
    // Handle chat updates
  }

  private handleChatDeleted(data: { chatId: string }): void {
    console.log('🗑️ Chat deleted:', data.chatId);
    // Handle chat deletion
  }

  private handleError(error: any): void {
    console.error('❌ Socket error:', error);
    
    store.dispatch(addNotification({
      type: 'error',
      title: 'Connection Error',
      message: error.message || 'An unexpected error occurred',
    }));
  }

  // Public methods
  joinChats(): void {
    if (!this.socket || !this.isConnected) return;
    
    console.log('🔗 Joining user chats');
    this.socket.emit('join_chats');
  }

  sendMessage(messageData: MessageData): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Cannot send message: Socket not connected');
      return;
    }

    console.log('📤 Sending message:', messageData);
    this.socket.emit('send_message', messageData);
  }

  startTyping(chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('typing_start', { chatId });
  }

  stopTyping(chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('typing_stop', { chatId });
  }

  markMessageAsDelivered(messageId: string, chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('message_delivered', { messageId, chatId });
  }

  markMessageAsRead(messageId: string, chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('message_read', { messageId, chatId });
  }

  joinChat(chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leave_chat', { chatId });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;