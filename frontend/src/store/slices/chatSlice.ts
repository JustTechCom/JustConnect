// frontend/src/store/slices/chatSlice.ts - Chat State Management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatMember, User } from '../../types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  
  // Online users tracking
  onlineUsers: Set<string>;
  typingUsers: { [chatId: string]: string[] };
  
  // Search
  searchResults: User[];
  isSearching: boolean;
  searchQuery: string;
  
  // Unread tracking
  unreadCounts: { [chatId: string]: number };
  totalUnreadCount: number;
  
  // Chat management
  pinnedChats: string[];
  archivedChats: string[];
  mutedChats: string[];
  
  // User discovery
  suggestedUsers: User[];
  nearbyUsers: User[];
  
  // Chat creation
  isCreatingChat: boolean;
  createChatError: string | null;
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
  
  onlineUsers: new Set(),
  typingUsers: {},
  
  searchResults: [],
  isSearching: false,
  searchQuery: '',
  
  unreadCounts: {},
  totalUnreadCount: 0,
  
  pinnedChats: [],
  archivedChats: [],
  mutedChats: [],
  
  suggestedUsers: [],
  nearbyUsers: [],
  
  isCreatingChat: false,
  createChatError: null,
};

// Mock API functions - replace with real API calls
const mockAPI = {
  getChats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      data: {
        chats: [
          {
            id: '1',
            type: 'DIRECT',
            name: null,
            avatar: null,
            description: null,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date(),
            createdBy: 'user2',
            lastMessage: 'Hey! How are you doing?',
            lastMessageAt: new Date(),
            members: [
              {
                id: '1',
                chatId: '1',
                userId: 'user2',
                role: 'MEMBER',
                joinedAt: new Date('2024-01-15'),
                user: {
                  id: 'user2',
                  username: 'john_doe',
                  firstName: 'John',
                  lastName: 'Doe',
                  avatar: null,
                  isOnline: true,
                  lastSeen: new Date(),
                }
              }
            ],
            messageCount: 25,
            unreadCount: 2,
            isPinned: true,
            isMuted: false,
            isVerified: false,
          },
          {
            id: '2',
            type: 'GROUP',
            name: 'Development Team',
            avatar: null,
            description: 'Team collaboration chat',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date(),
            createdBy: 'user1',
            lastMessage: 'Meeting at 3 PM today',
            lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            members: [
              {
                id: '2',
                chatId: '2',
                userId: 'user3',
                role: 'ADMIN',
                joinedAt: new Date('2024-01-10'),
                user: {
                  id: 'user3',
                  username: 'jane_smith',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  avatar: null,
                  isOnline: false,
                  lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
                }
              },
              {
                id: '3',
                chatId: '2',
                userId: 'user4',
                role: 'MEMBER',
                joinedAt: new Date('2024-01-12'),
                user: {
                  id: 'user4',
                  username: 'alex_dev',
                  firstName: 'Alex',
                  lastName: 'Developer',
                  avatar: null,
                  isOnline: true,
                  lastSeen: new Date(),
                }
              }
            ],
            messageCount: 145,
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isVerified: true,
          }
        ]
      }
    };
  },
  
  createChat: async (chatData: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      data: {
        chat: {
          id: Date.now().toString(),
          ...chatData,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isVerified: false,
        }
      }
    };
  },
  
  searchUsers: async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUsers = [
      {
        id: 'search1',
        username: 'sarah_wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
        avatar: null,
        isOnline: true,
        lastSeen: new Date(),
        mutualFriends: 3,
        bio: 'Product Designer at TechCorp'
      },
      {
        id: 'search2',
        username: 'mike_johnson',
        firstName: 'Mike',
        lastName: 'Johnson',
        avatar: null,
        isOnline: false,
        lastSeen: new Date(Date.now() - 60 * 60 * 1000),
        mutualFriends: 8,
        bio: 'Frontend Developer'
      }
    ];
    
    return {
      data: {
        users: mockUsers.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName.toLowerCase().includes(query.toLowerCase())
        )
      }
    };
  }
};

// Async thunks
export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockAPI.getChats();
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
      const response = await mockAPI.createChat({
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
      const response = await mockAPI.createChat({
        type: 'GROUP',
        ...chatData
      });
      return response.data.chat;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create group chat');
    }
  }
);

export const createChannel = createAsyncThunk(
  'chats/createChannel',
  async (channelData: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await mockAPI.createChat({
        type: 'CHANNEL',
        ...channelData
      });
      return response.data.chat;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create channel');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'chats/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await mockAPI.searchUsers(query);
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
    // Active chat management
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      
      // Mark as read when opening a chat
      if (action.payload) {
        const chatId = action.payload.id;
        if (state.unreadCounts[chatId]) {
          state.totalUnreadCount -= state.unreadCounts[chatId];
          state.unreadCounts[chatId] = 0;
        }
        
        // Update the chat in the list
        const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      }
    },
    
    // Chat list management
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
    
    updateChat: (state, action: PayloadAction<Partial<Chat> & { id: string }>) => {
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = { ...state.chats[chatIndex], ...action.payload };
      }
    },
    
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat.id !== action.payload);
      if (state.activeChat?.id === action.payload) {
        state.activeChat = null;
      }
    },
    
    // Message updates
    updateLastMessage: (state, action: PayloadAction<{
      chatId: string;
      message: string;
      timestamp: Date;
      incrementUnread?: boolean;
    }>) => {
      const { chatId, message, timestamp, incrementUnread = true } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].lastMessageAt = timestamp;
        
        // Increment unread count if not the active chat
        if (incrementUnread && state.activeChat?.id !== chatId) {
          if (!state.chats[chatIndex].unreadCount) {
            state.chats[chatIndex].unreadCount = 0;
          }
          state.chats[chatIndex].unreadCount!++;
          
          if (!state.unreadCounts[chatId]) {
            state.unreadCounts[chatId] = 0;
          }
          state.unreadCounts[chatId]++;
          state.totalUnreadCount++;
        }
        
        // Move chat to top of list
        const chat = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chat);
      }
    },
    
    // Online status management
    setUserOnline: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      
      if (isOnline) {
        state.onlineUsers.add(userId);
      } else {
        state.onlineUsers.delete(userId);
      }
      
      // Update user status in all chats
      state.chats.forEach(chat => {
        const memberIndex = chat.members.findIndex(member => member.user.id === userId);
        if (memberIndex !== -1) {
          chat.members[memberIndex].user.isOnline = isOnline;
          if (!isOnline) {
            chat.members[memberIndex].user.lastSeen = new Date();
          }
        }
      });
      
      // Update active chat if needed
      if (state.activeChat) {
        const memberIndex = state.activeChat.members.findIndex(member => member.user.id === userId);
        if (memberIndex !== -1) {
          state.activeChat.members[memberIndex].user.isOnline = isOnline;
          if (!isOnline) {
            state.activeChat.members[memberIndex].user.lastSeen = new Date();
          }
        }
      }
    },
    
    // Typing indicators
    setUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string; username: string }>) => {
      const { chatId, userId, username } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (!state.typingUsers[chatId].includes(username)) {
        state.typingUsers[chatId].push(username);
      }
    },
    
    setUserStoppedTyping: (state, action: PayloadAction<{ chatId: string; userId: string; username: string }>) => {
      const { chatId, username } = action.payload;
      
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(user => user !== username);
        
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      }
    },
    
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      delete state.typingUsers[action.payload];
    },
    
    // Search management
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    
    // Chat preferences
    pinChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.pinnedChats.includes(chatId)) {
        state.pinnedChats.push(chatId);
      }
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].isPinned = true;
      }
    },
    
    unpinChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.pinnedChats = state.pinnedChats.filter(id => id !== chatId);
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].isPinned = false;
      }
    },
    
    muteChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.mutedChats.includes(chatId)) {
        state.mutedChats.push(chatId);
      }
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].isMuted = true;
      }
    },
    
    unmuteChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.mutedChats = state.mutedChats.filter(id => id !== chatId);
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].isMuted = false;
      }
    },
    
    archiveChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (!state.archivedChats.includes(chatId)) {
        state.archivedChats.push(chatId);
      }
      
      // Remove from main chat list
      state.chats = state.chats.filter(chat => chat.id !== chatId);
      
      // Clear active chat if it's the archived one
      if (state.activeChat?.id === chatId) {
        state.activeChat = null;
      }
    },
    
    unarchiveChat: (state, action: PayloadAction<{ chatId: string; chat: Chat }>) => {
      const { chatId, chat } = action.payload;
      state.archivedChats = state.archivedChats.filter(id => id !== chatId);
      
      // Add back to main chat list
      state.chats.unshift(chat);
    },
    
    // Unread management
    markChatAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      
      if (state.unreadCounts[chatId]) {
        state.totalUnreadCount -= state.unreadCounts[chatId];
        delete state.unreadCounts[chatId];
      }
      
      // Update chat in list
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    
    markAllChatsAsRead: (state) => {
      state.unreadCounts = {};
      state.totalUnreadCount = 0;
      
      state.chats.forEach(chat => {
        chat.unreadCount = 0;
      });
    },
    
    // Reset chat state
    resetChatState: (state) => {
      return initialState;
    },
    
    // Error management
    clearError: (state) => {
      state.error = null;
      state.createChatError = null;
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
        
        // Calculate total unread count
        state.totalUnreadCount = action.payload.reduce((total, chat) => 
          total + (chat.unreadCount || 0), 0
        );
        
        // Build unread counts map
        action.payload.forEach(chat => {
          if (chat.unreadCount && chat.unreadCount > 0) {
            state.unreadCounts[chat.id] = chat.unreadCount;
          }
        });
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create direct chat
    builder
      .addCase(createDirectChat.pending, (state) => {
        state.isCreatingChat = true;
        state.createChatError = null;
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        state.isCreatingChat = false;
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createDirectChat.rejected, (state, action) => {
        state.isCreatingChat = false;
        state.createChatError = action.payload as string;
      });

    // Create group chat
    builder
      .addCase(createGroupChat.pending, (state) => {
        state.isCreatingChat = true;
        state.createChatError = null;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.isCreatingChat = false;
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.isCreatingChat = false;
        state.createChatError = action.payload as string;
      });

    // Create channel
    builder
      .addCase(createChannel.pending, (state) => {
        state.isCreatingChat = true;
        state.createChatError = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.isCreatingChat = false;
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.isCreatingChat = false;
        state.createChatError = action.payload as string;
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
  },
});

export const {
  setActiveChat,
  addChat,
  updateChat,
  removeChat,
  updateLastMessage,
  setUserOnline,
  setUserTyping,
  setUserStoppedTyping,
  clearTypingUsers,
  setSearchQuery,
  clearSearchResults,
  pinChat,
  unpinChat,
  muteChat,
  unmuteChat,
  archiveChat,
  unarchiveChat,
  markChatAsRead,
  markAllChatsAsRead,
  resetChatState,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;