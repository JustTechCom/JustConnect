import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMember } from '../../types';
import api from '../../services/api';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  onlineUsers: Set<string>;
  typingUsers: { [chatId: string]: string[] };
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  onlineUsers: new Set(),
  typingUsers: {},
};

// Async thunks
export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chats');
      return response.data.chats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch chats');
    }
  }
);

export const createChat = createAsyncThunk(
  'chats/createChat',
  async (chatData: {
    type: 'DIRECT' | 'GROUP' | 'CHANNEL';
    memberIds: string[];
    name?: string;
    description?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/chats', chatData);
      return response.data.chat;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create chat');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'chats/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/search?q=${query}`);
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
    setActiveChat: (state, action: PayloadAction<Chat>) => {
      state.activeChat = action.payload;
    },
    clearActiveChat: (state) => {
      state.activeChat = null;
    },
    updateChatLastMessage: (state, action: PayloadAction<{ chatId: string; message: string; timestamp: string }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessage = action.payload.message;
        chat.lastMessageAt = new Date(action.payload.timestamp);
        
        // Move chat to top
        state.chats = [chat, ...state.chats.filter(c => c.id !== action.payload.chatId)];
        
        // Update active chat if it's the same
        if (state.activeChat?.id === action.payload.chatId) {
          state.activeChat = { ...state.activeChat, ...action.payload };
        }
      }
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
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = new Set(action.payload);
    },
    addOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.add(action.payload);
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.delete(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload.sort((a: Chat, b: Chat) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create chat
    builder
      .addCase(createChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats.unshift(action.payload);
      })
      .addCase(createChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveChat,
  clearActiveChat,
  updateChatLastMessage,
  addUserTyping,
  removeUserTyping,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;