// frontend/src/services/socketService.ts - Enhanced real-time functionality
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
      const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();

      this.socket.on('connect', () => {
        console.log('🔌 Connected to server');
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
        this.handleReconnect();
        reject(error);
      });
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
      
      if (reason === 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connected successfully:', data);
    });

    this.socket.on('chats_joined', (data) => {
      console.log('📱 Joined chats:', data);
    });

    // Message events
    this.socket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message);
      
      store.dispatch(addMessage(message));
      store.dispatch(updateChatLastMessage({
        chatId: message.chatId,
        message: message.content,
        timestamp: message.createdAt.toString(),
        senderId: message.senderId
      }));

      // Show notification if not from current user and not current chat
      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      const activeChat = state.chats.activeChat;
      
      if (message.senderId !== currentUserId) {
        // Play notification sound
        this.playNotificationSound();
        
        // Show browser notification if not in active chat
        if (!activeChat || activeChat.id !== message.chatId) {
          this.showBrowserNotification(
            `${message.sender.firstName} ${message.sender.lastName}`,
            message.content,
            message.sender.avatar
          );
          
          // Show in-app notification
          store.dispatch(addNotification({
            type: 'info',
            title: `${message.sender.firstName} ${message.sender.lastName}`,
            message: message.content,
          }));
        }

        // Auto-mark as delivered
        this.markMessageAsDelivered(message.id, message.chatId);
      }
    });

    this.socket.on('message_sent', (data: { tempId?: string; message: Message }) => {
      console.log('✅ Message sent confirmation:', data);
      
      if (data.tempId) {
        store.dispatch(replaceTempMessage({
          tempId: data.tempId,
          realMessage: data.message
        }));
      }
    });

    this.socket.on('message_status_updated', (data: { 
      messageId: string; 
      status: string; 
      chatId: string;
      userId?: string;
      readBy?: string;
    }) => {
      console.log('📋 Message status updated:', data);
      
      store.dispatch(updateMessageStatus({
        messageId: data.messageId,
        chatId: data.chatId,
        status: data.status as 'sent' | 'delivered' | 'read',
        userId: data.userId || data.readBy
      }));
    });

    this.socket.on('messages_delivered', (data: {
      chatId: string;
      messageIds: string[];
      deliveredBy: string;
    }) => {
      console.log('📨 Messages delivered:', data);
      
      data.messageIds.forEach(messageId => {
        store.dispatch(updateMessageStatus({
          messageId,
          chatId: data.chatId,
          status: 'delivered',
          userId: data.deliveredBy
        }));
      });
    });

    this.socket.on('messages_read', (data: {
      chatId: string;
      messageIds: string[];
      readBy: string;
    }) => {
      console.log('👁️ Messages read:', data);
      
      store.dispatch(markChatMessagesAsRead({
        chatId: data.chatId,
        messageIds: data.messageIds
      }));
    });

    // Typing events
    this.socket.on('user_typing', (data: { userId: string; chatId: string; user?: any }) => {
      console.log('⌨️ User typing:', data);
      
      store.dispatch(addUserTyping({
        chatId: data.chatId,
        userId: data.userId,
        user: data.user
      }));

      // Auto-remove typing after 10 seconds
      this.clearTypingTimeout(data.chatId, data.userId);
      const timeoutId = setTimeout(() => {
        store.dispatch(removeUserTyping({
          chatId: data.chatId,
          userId: data.userId
        }));
      }, 10000);
      
      this.typingTimeouts.set(`${data.chatId}-${data.userId}`, timeoutId);
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; chatId: string }) => {
      console.log('⌨️ User stopped typing:', data);
      
      store.dispatch(removeUserTyping({
        chatId: data.chatId,
        userId: data.userId
      }));
      
      this.clearTypingTimeout(data.chatId, data.userId);
    });

    // Online status events
    this.socket.on('friend_status_changed', (data: { 
      userId: string; 
      isOnline: boolean; 
      timestamp: string;
    }) => {
      console.log('👤 Friend status changed:', data);
      
      store.dispatch(updateFriendOnlineStatus({
        userId: data.userId,
        isOnline: data.isOnline
      }));
      
      if (data.isOnline) {
        store.dispatch(addOnlineUser(data.userId));
      } else {
        store.dispatch(removeOnlineUser(data.userId));
      }
    });

    // Chat events
    this.socket.on('new_chat', (chat: Chat) => {
      console.log('💬 New chat created:', chat);
      
      store.dispatch(addNewChat(chat));
      
      // Join the new chat room
      this.socket?.emit('join_chat', { chatId: chat.id });
    });

    this.socket.on('chat_updated', (chat: Chat) => {
      console.log('📝 Chat updated:', chat);
      
      store.dispatch(updateChat(chat));
    });

    this.socket.on('member_left', (data: { 
      chatId: string; 
      userId: string; 
      memberCount: number;
    }) => {
      console.log('👋 Member left chat:', data);
      
      store.dispatch(removeMember({
        chatId: data.chatId,
        userId: data.userId
      }));
    });

    // Friend request events
    this.socket.on('friend_request_received', (data: { 
      friendship: any; 
      requester: any;
    }) => {
      console.log('🤝 Friend request received:', data);
      
      store.dispatch(addFriendRequest({
        type: 'received',
        request: data.friendship
      }));
      
      store.dispatch(addNotification({
        type: 'info',
        title: 'New Friend Request',
        message: `${data.requester.firstName} ${data.requester.lastName} sent you a friend request`,
      }));
      
      this.showBrowserNotification(
        'New Friend Request',
        `${data.requester.firstName} ${data.requester.lastName} wants to be your friend`,
        data.requester.avatar
      );
    });

    this.socket.on('friend_request_response', (data: { 
      friendship: any; 
      action: 'accept' | 'reject';
    }) => {
      console.log('🤝 Friend request response:', data);
      
      store.dispatch(removeFriendRequest({
        type: 'sent',
        requestId: data.friendship.id
      }));
      
      if (data.action === 'accept') {
        store.dispatch(addFriend(data.friendship.addressee));
        
        store.dispatch(addNotification({
          type: 'success',
          title: 'Friend Request Accepted',
          message: `${data.friendship.addressee.firstName} ${data.friendship.addressee.lastName} accepted your friend request`,
        }));
      }
    });

    this.socket.on('friend_removed', (data: { userId: string }) => {
      console.log('💔 Friend removed:', data);
      
      // This would be handled in auth slice
      store.dispatch(addNotification({
        type: 'info',
        title: 'Friend Removed',
        message: 'Someone removed you from their friends list',
      }));
    });

    // Reaction events
    this.socket.on('reaction_added', (data: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      console.log('😀 Reaction added:', data);
      
      const state = store.getState();
      const activeChat = state.chats.activeChat;
      
      if (activeChat) {
        store.dispatch(addMessageReaction({
          messageId: data.messageId,
          chatId: activeChat.id,
          emoji: data.emoji,
          userId: data.userId
        }));
      }
    });

    this.socket.on('reaction_removed', (data: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      console.log('😐 Reaction removed:', data);
      
      const state = store.getState();
      const activeChat = state.chats.activeChat;
      
      if (activeChat) {
        store.dispatch(removeMessageReaction({
          messageId: data.messageId,
          chatId: activeChat.id,
          emoji: data.emoji,
          userId: data.userId
        }));
      }
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

    // Call events (future implementation)
    this.socket.on('incoming_call', (data: {
      callId: string;
      caller: any;
      type: 'audio' | 'video';
    }) => {
      console.log('📞 Incoming call:', data);
      
      // Handle incoming call UI
      store.dispatch(addNotification({
        type: 'info',
        title: `Incoming ${data.type} call`,
        message: `${data.caller.firstName} ${data.caller.lastName} is calling you`,
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
          this.connect(token).catch(console.error);
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000);
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
      audio.play().catch(console.warn);
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

  private clearTypingTimeout(chatId: string, userId: string): void {
    const key = `${chatId}-${userId}`;
    const timeoutId = this.typingTimeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.typingTimeouts.delete(key);
    }
  }

  private clearAllTypingTimeouts(): void {
    this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.typingTimeouts.clear();
  }

  // Public methods for emitting events
  sendMessage(data: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
    tempId?: string;
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

  sendFriendRequest(targetUserId: string): void {
    this.socket?.emit('send_friend_request', { targetUserId });
  }

  // Voice/Video call methods (for future implementation)
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

  // Auto-typing management
  private typingDebounceTimeout: NodeJS.Timeout | null = null;
  private isCurrentlyTyping = false;

  handleTyping(chatId: string): void {
    if (!this.isCurrentlyTyping) {
      this.startTyping(chatId);
      this.isCurrentlyTyping = true;
    }

    // Clear previous timeout
    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
    }

    // Stop typing after 3 seconds of inactivity
    this.typingDebounceTimeout = setTimeout(() => {
      this.stopTyping(chatId);
      this.isCurrentlyTyping = false;
    }, 3000);
  }

  stopTypingImmediate(chatId: string): void {
    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
      this.typingDebounceTimeout = null;
    }
    
    if (this.isCurrentlyTyping) {
      this.stopTyping(chatId);
      this.isCurrentlyTyping = false;
    }
  }
}

export const socketService = new SocketService();
export default socketService;