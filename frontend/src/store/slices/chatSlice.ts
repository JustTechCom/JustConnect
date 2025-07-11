// frontend/src/store/slices/chatSlice.ts - Professional Chat Management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMember, User } from '../../types';
import { chatAPI, userAPI } from '../../services/api';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  onlineUsers: Set<string>;
  activeUsers: Set<string>; // Alias for onlineUsers for compatibility
  typingUsers: { [chatId: string]: string[] };
  searchResults: User[];
  isSearching: boolean;
  unreadCounts: { [chatId: string]: number };
  pinnedChats: string[];
  archivedChats: string[];
  lastActivity: { [userId: string]: Date };
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  onlineUsers: new Set(),
  activeUsers: new Set(), // Initialize activeUsers as well
  typingUsers: {},
  searchResults: [],
  isSearching: false,
  unreadCounts: {},
  pinnedChats: [],
  archivedChats: [],
  lastActivity: {},
  connectionStatus: 'disconnected',
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
      const currentUser = state.auth.user;
      const friends = state.auth.friends || [];
      
      // Exclude current user and existing friends from search
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

export const addMembersToChat = createAsyncThunk(
  'chats/addMembers',
  async ({ chatId, memberIds }: { chatId: string; memberIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.addMembers(chatId, memberIds);
      return { chatId, addedMembers: response.data.addedMembers, chat: response.data.chat };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add members');
    }
  }
);

export const leaveChat = createAsyncThunk(
  'chats/leaveChat',
  async (chatId: string, { rejectWithValue }) => {
    try {
      await chatAPI.leaveChat(chatId);
      return chatId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to leave chat');
    }
  }
);

export const updateChatInfo = createAsyncThunk(
  'chats/updateChatInfo',
  async ({ chatId, data }: { 
    chatId: string; 
    data: { name?: string; description?: string; avatar?: string; }
  }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.updateChat(chatId, data);
      return response.data.chat;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update chat');
    }
  }
);

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      
      // Mark messages as read when opening chat
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
      const { chatId, message, timestamp, senderId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat) {
        chat.lastMessage = message;
        chat.lastMessageAt = new Date(timestamp);
        
        // Move chat to top if it's not the active chat
        if (state.activeChat?.id !== chatId) {
          state.chats = [chat, ...state.chats.filter(c => c.id !== chatId)];
          
          // Increment unread count
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
    
    addUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string; user?: any }>) => {
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
    
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = new Set(action.payload);
      state.activeUsers = new Set(action.payload); // Keep activeUsers in sync
    },
    
    addOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.add(action.payload);
      state.activeUsers.add(action.payload); // Keep activeUsers in sync
      state.lastActivity[action.payload] = new Date();
    },
    
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers.delete(action.payload);
      state.activeUsers.delete(action.payload); // Keep activeUsers in sync
      state.lastActivity[action.payload] = new Date();
    },
    
    setActiveUsers: (state, action: PayloadAction<string[]>) => {
      state.activeUsers = new Set(action.payload);
      state.onlineUsers = new Set(action.payload); // Keep onlineUsers in sync
    },
    
    addActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUsers.add(action.payload);
      state.onlineUsers.add(action.payload); // Keep onlineUsers in sync
      state.lastActivity[action.payload] = new Date();
    },
    
    removeActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUsers.delete(action.payload);
      state.onlineUsers.delete(action.payload); // Keep onlineUsers in sync
      state.lastActivity[action.payload] = new Date();
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
    
    pinChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.pinnedChats.includes(chatId)) {
        state.pinnedChats.push(chatId);
      }
    },
    
    unpinChat: (state, action: PayloadAction<string>) => {
      state.pinnedChats = state.pinnedChats.filter(id => id !== action.payload);
    },
    
    archiveChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.archivedChats.includes(chatId)) {
        state.archivedChats.push(chatId);
      }
    },
    
    unarchiveChat: (state, action: PayloadAction<string>) => {
      state.archivedChats = state.archivedChats.filter(id => id !== action.payload);
    },
    
    updateMemberRole: (state, action: PayloadAction<{ chatId: string; userId: string; role: string }>) => {
      const { chatId, userId, role } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat) {
        const member = chat.members && chat.members.find(m => m.user.id === userId);
        if (member) {
          member.role = role as any;
        }
      }
      
      if (state.activeChat?.id === chatId && state.activeChat.members) {
        const member = state.activeChat.members.find(m => m.user.id === userId);
        if (member) {
          member.role = role as any;
        }
      }
    },
    
    removeMember: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat && chat.members) {
        chat.members = chat.members.filter(m => m.user.id !== userId);
      }
      
      if (state.activeChat?.id === chatId && state.activeChat.members) {
        state.activeChat.members = state.activeChat.members.filter(m => m.user.id !== userId);
      }
    },
    
    addMember: (state, action: PayloadAction<{ chatId: string; member: ChatMember }>) => {
      const { chatId, member } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat && chat.members) {
        const existingMember = chat.members.find(m => m.user.id === member.user.id);
        if (!existingMember) {
          chat.members.push(member);
        }
      }
      
      if (state.activeChat?.id === chatId && state.activeChat.members) {
        const existingMember = state.activeChat.members.find(m => m.user.id === member.user.id);
        if (!existingMember) {
          state.activeChat.members.push(member);
        }
      }
    },
    
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'connecting' | 'disconnected'>) => {
      state.connectionStatus = action.payload;
    },
    
    updateLastActivity: (state, action: PayloadAction<{ userId: string; timestamp: Date }>) => {
      state.lastActivity[action.payload.userId] = action.payload.timestamp;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    sortChats: (state) => {
      state.chats.sort((a, b) => {
        // Pinned chats first
        const aPinned = state.pinnedChats.includes(a.id);
        const bPinned = state.pinnedChats.includes(b.id);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Then by last message time
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        
        return bTime - aTime;
      });
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
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create direct chat
    builder
      .addCase(createDirectChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        const existingChat = state.chats.find(c => c.id === newChat.id);
        if (!existingChat) {
          state.chats.unshift(newChat);
        }
        state.activeChat = newChat;
      });

    // Create group chat
    builder
      .addCase(createGroupChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        state.chats.unshift(newChat);
        state.activeChat = newChat;
      });

    // Search users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });

    // Add members to chat
    builder
      .addCase(addMembersToChat.fulfilled, (state, action) => {
        const { chatId, chat } = action.payload;
        const chatIndex = state.chats.findIndex(c => c.id === chatId);
        
        if (chatIndex !== -1) {
          state.chats[chatIndex] = chat;
        }
        
        if (state.activeChat?.id === chatId) {
          state.activeChat = chat;
        }
      });

    // Leave chat
    builder
      .addCase(leaveChat.fulfilled, (state, action) => {
        const chatId = action.payload;
        state.chats = state.chats.filter(c => c.id !== chatId);
        
        if (state.activeChat?.id === chatId) {
          state.activeChat = null;
        }
        
        delete state.unreadCounts[chatId];
      });

    // Update chat info
    builder
      .addCase(updateChatInfo.fulfilled, (state, action) => {
        const updatedChat = action.payload;
        const chatIndex = state.chats.findIndex(c => c.id === updatedChat.id);
        
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat;
        }
        
        if (state.activeChat?.id === updatedChat.id) {
          state.activeChat = updatedChat;
        }
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
  addOnlineUser,
  removeOnlineUser,
  setActiveUsers,
  addActiveUser,
  removeActiveUser,
  clearSearchResults,
  setUnreadCount,
  markChatAsRead,
  pinChat,
  unpinChat,
  archiveChat,
  unarchiveChat,
  updateMemberRole,
  removeMember,
  addMember,
  setConnectionStatus,
  updateLastActivity,
  clearError,
  sortChats
} = chatSlice.actions;

export default chatSlice.reducer;