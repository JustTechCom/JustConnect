// frontend/src/store/slices/chatSlice.ts - EMERGENCY FIX
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMember, User } from '../../types';
import { chatAPI, userAPI } from '../../services/api';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  onlineUsers: Set<string>;
  activeUsers: Set<string>; // CRITICAL: Must be here for compatibility
  typingUsers: { [chatId: string]: string[] };
  searchResults: User[];
  isSearching: boolean;
  unreadCounts: { [chatId: string]: number };
  pinnedChats: string[];
  archivedChats: string[];
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  onlineUsers: new Set<string>(),
  activeUsers: new Set<string>(), // CRITICAL: Initialize this!
  typingUsers: {},
  searchResults: [],
  isSearching: false,
  unreadCounts: {},
  pinnedChats: [],
  archivedChats: [],
};

// Async thunks
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
      return rejectWithValue(error.response?.data?.error || 'Failed to create chat');
    }
  }
);

export const createGroupChat = createAsyncThunk(
  'chats/createGroupChat',
  async (chatData: {
    name: string;
    description?: string;
    memberIds: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createChat({
        type: 'GROUP',
        ...chatData
      });
      return response.data.chat;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create group chat');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'chats/searchUsers',
  async (query: string, { rejectWithValue, getState }) => {
    try {
      if (!query.trim()) {
        return [];
      }
      
      const state = getState() as any;
      const currentUser = state.auth?.user;
      const friends = state.auth?.friends || [];
      
      const excludeIds = [currentUser?.id, ...friends.map((f: User) => f.id)].filter(Boolean);
      
      const response = await userAPI.searchUsers(query, { 
        limit: 20,
        exclude: excludeIds 
      });
      
      return response.data.users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to search users');
    }
  }
);

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      if (action.payload) {
        state.unreadCounts[action.payload.id] = 0;
      }
    },
    
    clearActiveChat: (state) => {
      state.activeChat = null;
    },
    
    updateChatLastMessage: (state, action: PayloadAction<{ 
      chatId: string; 
      message: string; 
      timestamp: string;
      senderId: string;
    }>) => {
      const { chatId, message, timestamp } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat) {
        chat.lastMessage = message;
        chat.lastMessageAt = new Date(timestamp);
        
        if (state.activeChat?.id !== chatId) {
          state.chats = [chat, ...state.chats.filter(c => c.id !== chatId)];
          state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
        }
      }
    },
    
    addNewChat: (state, action: PayloadAction<Chat>) => {
      const existingChat = state.chats.find(c => c.id === action.payload.id);
      if (!existingChat) {
        state.chats.unshift(action.payload);
      }
    },
    
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = action.payload;
      }
      
      if (state.activeChat?.id === action.payload.id) {
        state.activeChat = action.payload;
      }
    },
    
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(c => c.id !== action.payload);
      if (state.activeChat?.id === action.payload) {
        state.activeChat = null;
      }
      delete state.unreadCounts[action.payload];
    },
    
    addUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      if (!state.typingUsers[chatId].includes(userId)) {
        state.typingUsers[chatId].push(userId);
      }
    },
    
    removeUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      }
    },
    
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      delete state.typingUsers[action.payload];
    },
    
    // CRITICAL: Both setOnlineUsers and setActiveUsers for compatibility
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = new Set(action.payload);
      state.activeUsers = new Set(action.payload); // Keep both in sync
    },
    
    setActiveUsers: (state, action: PayloadAction<string[]>) => {
      state.activeUsers = new Set(action.payload);
      state.onlineUsers = new Set(action.payload); // Keep both in sync
    },
    
    addOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.add(action.payload);
      state.activeUsers.add(action.payload); // Keep both in sync
    },
    
    addActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUsers.add(action.payload);
      state.onlineUsers.add(action.payload); // Keep both in sync
    },
    
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.delete(action.payload);
      state.activeUsers.delete(action.payload); // Keep both in sync
    },
    
    removeActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUsers.delete(action.payload);
      state.onlineUsers.delete(action.payload); // Keep both in sync
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    setUnreadCount: (state, action: PayloadAction<{ chatId: string; count: number }>) => {
      state.unreadCounts[action.payload.chatId] = action.payload.count;
    },
    
    markChatAsRead: (state, action: PayloadAction<string>) => {
      state.unreadCounts[action.payload] = 0;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload || [];
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        if (newChat) {
          const existingChat = state.chats.find(c => c.id === newChat.id);
          if (!existingChat) {
            state.chats.unshift(newChat);
          }
          state.activeChat = newChat;
        }
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        if (newChat) {
          state.chats.unshift(newChat);
          state.activeChat = newChat;
        }
      })
      .addCase(searchUsers.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveChat,
  clearActiveChat,
  updateChatLastMessage,
  addNewChat,
  updateChat,
  removeChat,
  addUserTyping,
  removeUserTyping,
  clearTypingUsers,
  setOnlineUsers,
  setActiveUsers,
  addOnlineUser,
  addActiveUser,
  removeOnlineUser,
  removeActiveUser,
  clearSearchResults,
  setUnreadCount,
  markChatAsRead,
  clearError
} = chatSlice.actions;

export default chatSlice.reducer;