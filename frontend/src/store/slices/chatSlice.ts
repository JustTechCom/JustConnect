// frontend/src/store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatAPI } from '../../services/api';

interface Chat {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  avatar?: string;
  description?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isOnline?: boolean;
  members?: any[];
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  onlineUsers: string[];
  typingUsers: { [chatId: string]: any[] };
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  onlineUsers: [],
  typingUsers: {},
};

export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChats();
      return response.data.chats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch chats');
    }
  }
);

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
    },
    updateChatLastMessage: (state, action: PayloadAction<{
      chatId: string;
      lastMessage: string;
      lastMessageAt: string;
    }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessage = action.payload.lastMessage;
        chat.lastMessageAt = action.payload.lastMessageAt;
      }
    },
    addUserTyping: (state, action: PayloadAction<{ chatId: string; user: any }>) => {
      const { chatId, user } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      const exists = state.typingUsers[chatId].find(u => u.id === user.id);
      if (!exists) {
        state.typingUsers[chatId].push(user);
      }
    },
    removeUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(u => u.id !== userId);
      }
    },
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    addNewChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = action.payload;
      }
    },
    addMember: (state, action: PayloadAction<{ chatId: string; user: any }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat && chat.members) {
        chat.members.push(action.payload.user);
      }
    },
    removeMember: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat && chat.members) {
        chat.members = chat.members.filter(m => m.id !== action.payload.userId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveChat,
  updateChatLastMessage,
  addUserTyping,
  removeUserTyping,
  addOnlineUser,
  removeOnlineUser,
  addNewChat,
  updateChat,
  addMember,
  removeMember,
} = chatSlice.actions;

export default chatSlice.reducer;

// frontend/src/store/slices/messageSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  chatId: string;
  senderId: string;
  createdAt: string;
  delivered: boolean;
  read: boolean;
  edited: boolean;
  sender?: any;
  replyTo?: any;
}

interface MessageState {
  messages: { [chatId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: MessageState = {
  messages: {},
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const { chatId } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(action.payload);
    },
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      chatId?: string;
      status: 'sent' | 'delivered' | 'read';
      userId?: string;
    }>) => {
      const { messageId, chatId, status } = action.payload;
      
      if (chatId && state.messages[chatId]) {
        const message = state.messages[chatId].find(m => m.id === messageId);
        if (message) {
          if (status === 'delivered') message.delivered = true;
          if (status === 'read') message.read = true;
        }
      }
    },
    replaceTempMessage: (state, action: PayloadAction<{
      tempId: string;
      realMessage: Message;
    }>) => {
      const { tempId, realMessage } = action.payload;
      const { chatId } = realMessage;
      
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m.id === tempId);
        if (index !== -1) {
          state.messages[chatId][index] = realMessage;
        }
      }
    },
    addMessageReaction: (state, action: PayloadAction<any>) => {
      // TODO: Implement message reactions
    },
    removeMessageReaction: (state, action: PayloadAction<any>) => {
      // TODO: Implement message reactions
    },
    markChatMessagesAsRead: (state, action: PayloadAction<{
      chatId: string;
      messageIds: string[];
    }>) => {
      const { chatId, messageIds } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId].forEach(message => {
          if (messageIds.includes(message.id)) {
            message.read = true;
          }
        });
      }
    },
  },
});

export const {
  addMessage,
  updateMessageStatus,
  replaceTempMessage,
  addMessageReaction,
  removeMessageReaction,
  markChatMessagesAsRead,
} = messageSlice.actions;

export default messageSlice.reducer;

// frontend/src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

const initialState: UIState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: true,
  notifications: [],
  isConnected: false,
  connectionStatus: 'disconnected',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload.toString());
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setConnectionStatus: (state, action: PayloadAction<UIState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
  },
});

export const {
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setConnectionStatus,
} = uiSlice.actions;

export default uiSlice.reducer;