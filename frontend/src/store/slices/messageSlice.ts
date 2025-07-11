// frontend/src/store/slices/messageSlice.ts - Message State Management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';

interface MessageState {
  // Messages grouped by chat ID
  messages: { [chatId: string]: Message[] };
  
  // Loading states
  isLoading: boolean;
  isSending: boolean;
  isLoadingMore: boolean;
  
  // Error states
  error: string | null;
  sendError: string | null;
  
  // Pagination
  hasMore: { [chatId: string]: boolean };
  isLoadingHistory: { [chatId: string]: boolean };
  
  // Message composition
  replyToMessage: Message | null;
  editingMessage: Message | null;
  drafts: { [chatId: string]: string };
  
  // File uploads
  uploadingFiles: { [messageId: string]: number }; // Progress percentage
  uploadErrors: { [messageId: string]: string };
  
  // Message reactions
  reactions: { [messageId: string]: { [emoji: string]: string[] } }; // emoji -> userIds
  
  // Search in messages
  searchResults: { [chatId: string]: Message[] };
  searchQuery: string;
  isSearchingMessages: boolean;
  
  // Message status tracking
  deliveredMessages: Set<string>;
  readMessages: Set<string>;
  
  // Temporary optimistic updates
  optimisticMessages: { [tempId: string]: Message };
  failedMessages: Set<string>;
}

const initialState: MessageState = {
  messages: {},
  isLoading: false,
  isSending: false,
  isLoadingMore: false,
  error: null,
  sendError: null,
  hasMore: {},
  isLoadingHistory: {},
  replyToMessage: null,
  editingMessage: null,
  drafts: {},
  uploadingFiles: {},
  uploadErrors: {},
  reactions: {},
  searchResults: {},
  searchQuery: '',
  isSearchingMessages: false,
  deliveredMessages: new Set(),
  readMessages: new Set(),
  optimisticMessages: {},
  failedMessages: new Set(),
};

// Mock API functions
const mockAPI = {
  getMessages: async (chatId: string, page = 1, limit = 50) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Hey! How are you doing?',
        type: 'TEXT',
        chatId,
        senderId: 'user2',
        replyTo: undefined,
        edited: false,
        delivered: true,
        read: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
        sender: {
          id: 'user2',
          username: 'john_doe',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
        },
      },
      {
        id: '2',
        content: 'I\'m doing great! Just finished working on the new features.',
        type: 'TEXT',
        chatId,
        senderId: 'current_user',
        replyTo: undefined,
        edited: false,
        delivered: true,
        read: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        sender: {
          id: 'current_user',
          username: 'you',
          firstName: 'You',
          lastName: '',
          avatar: null,
        },
      },
      {
        id: '3',
        content: 'That sounds awesome! Can you show me a demo?',
        type: 'TEXT',
        chatId,
        senderId: 'user2',
        replyTo: '2',
        edited: false,
        delivered: true,
        read: true,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
        sender: {
          id: 'user2',
          username: 'john_doe',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
        },
        replyToMessage: {
          id: '2',
          content: 'I\'m doing great! Just finished working on the new features.',
          type: 'TEXT',
          chatId,
          senderId: 'current_user',
          replyTo: undefined,
          edited: false,
          delivered: true,
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000),
          sender: {
            id: 'current_user',
            username: 'you',
            firstName: 'You',
            lastName: '',
            avatar: null,
          },
        },
      },
    ];
    
    return {
      data: {
        messages: mockMessages,
        hasMore: page < 3, // Simulate pagination
        total: 150,
      }
    };
  },
  
  sendMessage: async (messageData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: {
        message: {
          id: Date.now().toString(),
          ...messageData,
          delivered: true,
          read: false,
          edited: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: {
            id: 'current_user',
            username: 'you',
            firstName: 'You',
            lastName: '',
            avatar: null,
          },
        }
      }
    };
  },
  
  editMessage: async (messageId: string, newContent: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: {
        message: {
          id: messageId,
          content: newContent,
          edited: true,
          updatedAt: new Date(),
        }
      }
    };
  },
  
  deleteMessage: async (messageId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  },
  
  uploadFile: async (file: File, onProgress: (progress: number) => void) => {
    // Simulate file upload with progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(i);
    }
    
    return {
      data: {
        url: `https://example.com/files/${file.name}`,
        filename: file.name,
        size: file.size,
        type: file.type,
      }
    };
  },
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ chatId, page = 1 }: { chatId: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await mockAPI.getMessages(chatId, page);
      return { chatId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: {
    chatId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION';
    replyTo?: string;
    files?: File[];
  }, { rejectWithValue }) => {
    try {
      const response = await mockAPI.sendMessage(messageData);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ messageId, content }: { messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await mockAPI.editMessage(messageId, content);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await mockAPI.deleteMessage(messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete message');
    }
  }
);

export const uploadFile = createAsyncThunk(
  'messages/uploadFile',
  async ({ file, messageId }: { file: File; messageId: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await mockAPI.uploadFile(file, (progress) => {
        dispatch(updateUploadProgress({ messageId, progress }));
      });
      return { messageId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload file');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Message management
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const chatId = message.chatId;
      
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      
      // Check if message already exists (prevent duplicates)
      const existingIndex = state.messages[chatId].findIndex(m => m.id === message.id);
      if (existingIndex === -1) {
        state.messages[chatId].push(message);
        
        // Sort messages by timestamp
        state.messages[chatId].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    },
    
    updateMessage: (state, action: PayloadAction<Partial<Message> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      
      // Find message in all chats
      for (const chatId in state.messages) {
        const messageIndex = state.messages[chatId].findIndex(m => m.id === id);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex] = {
            ...state.messages[chatId][messageIndex],
            ...updates
          };
          break;
        }
      }
    },
    
    removeMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      
      // Find and remove message from all chats
      for (const chatId in state.messages) {
        state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
      }
    },
    
    // Optimistic updates
    addOptimisticMessage: (state, action: PayloadAction<{ tempId: string; message: Message }>) => {
      const { tempId, message } = action.payload;
      state.optimisticMessages[tempId] = message;
      
      // Add to chat messages for immediate display
      const chatId = message.chatId;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    },
    
    confirmOptimisticMessage: (state, action: PayloadAction<{ tempId: string; realMessage: Message }>) => {
      const { tempId, realMessage } = action.payload;
      
      // Remove from optimistic messages
      delete state.optimisticMessages[tempId];
      
      // Update the message in chat with real data
      const chatId = realMessage.chatId;
      if (state.messages[chatId]) {
        const messageIndex = state.messages[chatId].findIndex(m => m.id === tempId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex] = realMessage;
        }
      }
    },
    
    failOptimisticMessage: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      
      // Mark as failed
      state.failedMessages.add(tempId);
      
      // Remove from optimistic messages
      delete state.optimisticMessages[tempId];
    },
    
    retryFailedMessage: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      state.failedMessages.delete(tempId);
    },
    
    // Message composition
    setReplyToMessage: (state, action: PayloadAction<Message | null>) => {
      state.replyToMessage = action.payload;
    },
    
    setEditingMessage: (state, action: PayloadAction<Message | null>) => {
      state.editingMessage = action.payload;
    },
    
    updateDraft: (state, action: PayloadAction<{ chatId: string; content: string }>) => {
      const { chatId, content } = action.payload;
      if (content.trim()) {
        state.drafts[chatId] = content;
      } else {
        delete state.drafts[chatId];
      }
    },
    
    clearDraft: (state, action: PayloadAction<string>) => {
      delete state.drafts[action.payload];
    },
    
    // File uploads
    updateUploadProgress: (state, action: PayloadAction<{ messageId: string; progress: number }>) => {
      const { messageId, progress } = action.payload;
      state.uploadingFiles[messageId] = progress;
      
      if (progress >= 100) {
        delete state.uploadingFiles[messageId];
      }
    },
    
    setUploadError: (state, action: PayloadAction<{ messageId: string; error: string }>) => {
      const { messageId, error } = action.payload;
      state.uploadErrors[messageId] = error;
      delete state.uploadingFiles[messageId];
    },
    
    clearUploadError: (state, action: PayloadAction<string>) => {
      delete state.uploadErrors[action.payload];
    },
    
    // Message reactions
    addReaction: (state, action: PayloadAction<{ messageId: string; emoji: string; userId: string }>) => {
      const { messageId, emoji, userId } = action.payload;
      
      if (!state.reactions[messageId]) {
        state.reactions[messageId] = {};
      }
      
      if (!state.reactions[messageId][emoji]) {
        state.reactions[messageId][emoji] = [];
      }
      
      if (!state.reactions[messageId][emoji].includes(userId)) {
        state.reactions[messageId][emoji].push(userId);
      }
    },
    
    removeReaction: (state, action: PayloadAction<{ messageId: string; emoji: string; userId: string }>) => {
      const { messageId, emoji, userId } = action.payload;
      
      if (state.reactions[messageId]?.[emoji]) {
        state.reactions[messageId][emoji] = state.reactions[messageId][emoji].filter(id => id !== userId);
        
        if (state.reactions[messageId][emoji].length === 0) {
          delete state.reactions[messageId][emoji];
        }
        
        if (Object.keys(state.reactions[messageId]).length === 0) {
          delete state.reactions[messageId];
        }
      }
    },
    
    // Message status
    markMessageAsDelivered: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      state.deliveredMessages.add(messageId);
      
      // Update message in chats
      for (const chatId in state.messages) {
        const messageIndex = state.messages[chatId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex].delivered = true;
          break;
        }
      }
    },
    
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      state.readMessages.add(messageId);
      state.deliveredMessages.add(messageId);
      
      // Update message in chats
      for (const chatId in state.messages) {
        const messageIndex = state.messages[chatId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex].read = true;
          state.messages[chatId][messageIndex].delivered = true;
          break;
        }
      }
    },
    
    markMessagesAsRead: (state, action: PayloadAction<{ chatId: string; messageIds: string[] }>) => {
      const { chatId, messageIds } = action.payload;
      
      messageIds.forEach(messageId => {
        state.readMessages.add(messageId);
        state.deliveredMessages.add(messageId);
      });
      
      // Update messages in chat
      if (state.messages[chatId]) {
        state.messages[chatId].forEach(message => {
          if (messageIds.includes(message.id)) {
            message.read = true;
            message.delivered = true;
          }
        });
      }
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setSearchResults: (state, action: PayloadAction<{ chatId: string; results: Message[] }>) => {
      const { chatId, results } = action.payload;
      state.searchResults[chatId] = results;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = {};
      state.searchQuery = '';
    },
    
    // Clear chat messages
    clearChatMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.messages[chatId];
      delete state.searchResults[chatId];
      delete state.drafts[chatId];
      delete state.hasMore[chatId];
      delete state.isLoadingHistory[chatId];
    },
    
    // Reset state
    resetMessageState: (state) => {
      return initialState;
    },
    
    // Error management
    clearError: (state) => {
      state.error = null;
      state.sendError = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const { chatId } = action.meta.arg;
        state.isLoading = true;
        state.isLoadingHistory[chatId] = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages, hasMore } = action.payload;
        
        state.isLoading = false;
        state.isLoadingHistory[chatId] = false;
        
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        
        // Prepend older messages (for pagination)
        state.messages[chatId] = [...messages, ...state.messages[chatId]];
        state.hasMore[chatId] = hasMore;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        
        const { chatId } = action.meta.arg;
        state.isLoadingHistory[chatId] = false;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.sendError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        
        const message = action.payload;
        const chatId = message.chatId;
        
        // Clear draft
        delete state.drafts[chatId];
        
        // Add message to chat
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        state.messages[chatId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.sendError = action.payload as string;
      });

    // Edit message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const { id, content, edited, updatedAt } = action.payload;
        
        // Update message in all chats
        for (const chatId in state.messages) {
          const messageIndex = state.messages[chatId].findIndex(m => m.id === id);
          if (messageIndex !== -1) {
            state.messages[chatId][messageIndex].content = content;
            state.messages[chatId][messageIndex].edited = edited;
            state.messages[chatId][messageIndex].updatedAt = updatedAt;
            break;
          }
        }
        
        // Clear editing state
        state.editingMessage = null;
      });

    // Delete message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        
        // Remove message from all chats
        for (const chatId in state.messages) {
          state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
        }
        
        // Clean up related data
        delete state.reactions[messageId];
        delete state.uploadErrors[messageId];
        state.failedMessages.delete(messageId);
      });

    // File upload
    builder
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        delete state.uploadingFiles[messageId];
        delete state.uploadErrors[messageId];
      })
      .addCase(uploadFile.rejected, (state, action) => {
        const { messageId } = action.meta.arg;
        delete state.uploadingFiles[messageId];
        state.uploadErrors[messageId] = action.payload as string;
      });
  },
});

export const {
  addMessage,
  updateMessage,
  removeMessage,
  addOptimisticMessage,
  confirmOptimisticMessage,
  failOptimisticMessage,
  retryFailedMessage,
  setReplyToMessage,
  setEditingMessage,
  updateDraft,
  clearDraft,
  updateUploadProgress,
  setUploadError,
  clearUploadError,
  addReaction,
  removeReaction,
  markMessageAsDelivered,
  markMessageAsRead,
  markMessagesAsRead,
  setSearchQuery,
  setSearchResults,
  clearSearchResults,
  clearChatMessages,
  resetMessageState,
  clearError,
} = messageSlice.actions;

export default messageSlice.reducer;