// frontend/src/store/slices/chatSlice.ts - BRAND NEW FROM SCRATCH
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMember, User } from '../../types';
import { chatAPI, userAPI } from '../../services/api';

// SAFE INITIAL STATE - Her property'i açık şekilde tanımlı
interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  // CRITICAL: Hem activeUsers hem onlineUsers tanımlı
  activeUsers: Set<string>;
  onlineUsers: Set<string>;
  typingUsers: Record<string, string[]>;
  searchResults: User[];
  isSearching: boolean;
  unreadCounts: Record<string, number>;
  pinnedChats: string[];
  archivedChats: string[];
}

// SAFE DEFAULT STATE - Her değer güvenli
const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  activeUsers: new Set<string>(),
  onlineUsers: new Set<string>(),
  typingUsers: {},
  searchResults: [],
  isSearching: false,
  unreadCounts: {},
  pinnedChats: [],
  archivedChats: []
};

// ASYNC THUNKS
export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChats();
      return response.data.chats || [];
    } catch (error: any) {
      console.error('Fetch chats error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch chats');
    }
  }
);

export const createDirectChat = createAsyncThunk(
  'chats/createDirectChat',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createChat({
        type: 'DIRECT',
        memberIds: [userId]
      });
      return response.data.chat;
    } catch (error: any) {
      console.error('Create direct chat error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to create chat');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'chats/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      if (!query?.trim()) {
        return [];
      }
      
      const response = await userAPI.searchUsers(query, { limit: 20 });
      return response.data.users || [];
    } catch (error: any) {
      console.error('Search users error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to search users');
    }
  }
);

// MAIN SLICE
const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    // SAFE REDUCERS
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      if (action.payload?.id) {
        state.unreadCounts[action.payload.id] = 0;
      }
    },

    clearActiveChat: (state) => {
      state.activeChat = null;
    },

    // CRITICAL: activeUsers ve onlineUsers SYNC
    setActiveUsers: (state, action: PayloadAction<string[]>) => {
      const users = action.payload || [];
      state.activeUsers = new Set(users);
      state.onlineUsers = new Set(users); // SYNC
    },

    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      const users = action.payload || [];
      state.onlineUsers = new Set(users);
      state.activeUsers = new Set(users); // SYNC
    },

    addActiveUser: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        state.activeUsers.add(action.payload);
        state.onlineUsers.add(action.payload); // SYNC
      }
    },

    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        state.onlineUsers.add(action.payload);
        state.activeUsers.add(action.payload); // SYNC
      }
    },

    removeActiveUser: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        state.activeUsers.delete(action.payload);
        state.onlineUsers.delete(action.payload); // SYNC
      }
    },

    removeOnlineUser: (state, action: PayloadAction<string>) => {
      if (action.payload) {
        state.onlineUsers.delete(action.payload);
        state.activeUsers.delete(action.payload); // SYNC
      }
    },

    // TYPING USERS
    addUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (chatId && userId) {
        if (!state.typingUsers[chatId]) {
          state.typingUsers[chatId] = [];
        }
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      }
    },

    removeUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (chatId && userId && state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      }
    },

    clearTypingUsers: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (chatId) {
        delete state.typingUsers[chatId];
      }
    },

    // CHAT MANAGEMENT
    addNewChat: (state, action: PayloadAction<Chat>) => {
      const newChat = action.payload;
      if (newChat?.id) {
        const existingIndex = state.chats.findIndex(c => c.id === newChat.id);
        if (existingIndex === -1) {
          state.chats.unshift(newChat);
        }
      }
    },

    updateChat: (state, action: PayloadAction<Chat>) => {
      const updatedChat = action.payload;
      if (updatedChat?.id) {
        const index = state.chats.findIndex(c => c.id === updatedChat.id);
        if (index !== -1) {
          state.chats[index] = updatedChat;
        }
        
        if (state.activeChat?.id === updatedChat.id) {
          state.activeChat = updatedChat;
        }
      }
    },

    removeChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (chatId) {
        state.chats = state.chats.filter(c => c.id !== chatId);
        if (state.activeChat?.id === chatId) {
          state.activeChat = null;
        }
        delete state.unreadCounts[chatId];
      }
    },

    // SEARCH
    clearSearchResults: (state) => {
      state.searchResults = [];
    },

    // ERROR HANDLING
    clearError: (state) => {
      state.error = null;
    },

    // UNREAD COUNTS
    setUnreadCount: (state, action: PayloadAction<{ chatId: string; count: number }>) => {
      const { chatId, count } = action.payload;
      if (chatId && typeof count === 'number') {
        state.unreadCounts[chatId] = count;
      }
    },

    markChatAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (chatId) {
        state.unreadCounts[chatId] = 0;
      }
    }
  },

  extraReducers: (builder) => {
    // FETCH CHATS
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload || [];
        state.error = null;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch chats';
      });

    // CREATE DIRECT CHAT
    builder
      .addCase(createDirectChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        if (newChat?.id) {
          const existingIndex = state.chats.findIndex(c => c.id === newChat.id);
          if (existingIndex === -1) {
            state.chats.unshift(newChat);
          }
          state.activeChat = newChat;
        }
      })
      .addCase(createDirectChat.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to create chat';
      });

    // SEARCH USERS
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string || 'Failed to search users';
      });
  }
});

// EXPORTS
export const {
  setActiveChat,
  clearActiveChat,
  setActiveUsers,
  setOnlineUsers,
  addActiveUser,
  addOnlineUser,
  removeActiveUser,
  removeOnlineUser,
  addUserTyping,
  removeUserTyping,
  clearTypingUsers,
  addNewChat,
  updateChat,
  removeChat,
  clearSearchResults,
  clearError,
  setUnreadCount,
  markChatAsRead
} = chatSlice.actions;

export default chatSlice.reducer;