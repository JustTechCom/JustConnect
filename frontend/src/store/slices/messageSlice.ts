// frontend/src/store/slices/messageSlice.ts - Enhanced message management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';
import { messageAPI } from '../../services/api';

interface MessageState {
  messages: { [chatId: string]: Message[] };
  isLoading: boolean;
  isSending: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: { [chatId: string]: boolean };
  currentPage: { [chatId: string]: number };
  tempMessages: { [tempId: string]: Message }; // For optimistic updates
  editingMessage: { messageId: string; content: string } | null;
  replyingTo: Message | null;
  searchResults: { [chatId: string]: Message[] };
  isSearching: boolean;
  uploadingFiles: { [fileId: string]: { progress: number; file: File } };
}

const initialState: MessageState = {
  messages: {},
  isLoading: false,
  isSending: false,
  isLoadingMore: false,
  error: null,
  hasMore: {},
  currentPage: {},
  tempMessages: {},
  editingMessage: null,
  replyingTo: null,
  searchResults: {},
  isSearching: false,
  uploadingFiles: {},
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ chatId, page = 1, before }: { 
    chatId: string; 
    page?: number; 
    before?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getMessages(chatId, { page, before, limit: 50 });
      return {
        chatId,
        messages: response.data.messages,
        page,
        hasMore: response.data.hasMore,
        isLoadMore: page > 1 || !!before
      };
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
    fileId?: string;
    tempId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.sendMessage(messageData);
      return { 
        message: response.data.message, 
        tempId: messageData.tempId 
      };
    } catch (error: any) {
      return rejectWithValue({
        error: error.response?.data?.error || 'Failed to send message',
        tempId: messageData.tempId
      });
    }
  }
);

export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ messageId, content }: { messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.editMessage(messageId, content);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ messageId, chatId }: { messageId: string; chatId: string }, { rejectWithValue }) => {
    try {
      await messageAPI.deleteMessage(messageId);
      return { messageId, chatId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ chatId, messageIds }: { chatId: string; messageIds: string[] }, { rejectWithValue }) => {
    try {
      await messageAPI.markAsRead(chatId, messageIds);
      return { chatId, messageIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark messages as read');
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async ({ chatId, query }: { chatId: string; query: string }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.searchMessages(chatId, query);
      return {
        chatId,
        messages: response.data.messages,
        query
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to search messages');
    }
  }
);

export const addReaction = createAsyncThunk(
  'messages/addReaction',
  async ({ messageId, emoji }: { messageId: string; emoji: string }, { rejectWithValue }) => {
    try {
      await messageAPI.addReaction(messageId, emoji);
      return { messageId, emoji };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add reaction');
    }
  }
);

export const uploadFile = createAsyncThunk(
  'messages/uploadFile',
  async ({ 
    file, 
    chatId, 
    onProgress 
  }: { 
    file: File; 
    chatId: string; 
    onProgress?: (progress: number) => void;
  }, { rejectWithValue, dispatch }) => {
    try {
      const fileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to uploading files
      dispatch(addUploadingFile({ fileId, file, progress: 0 }));
      
      const response = await messageAPI.uploadFile(file, chatId, (progress) => {
        dispatch(updateUploadProgress({ fileId, progress }));
        onProgress?.(progress);
      });
      
      // Remove from uploading files
      dispatch(removeUploadingFile(fileId));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload file');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (!state.messages[message.chatId]) {
        state.messages[message.chatId] = [];
      }
      
      // Check if message already exists (prevent duplicates)
      const existingMessage = state.messages[message.chatId].find(m => m.id === message.id);
      if (!existingMessage) {
        state.messages[message.chatId].push(message);
        
        // Sort messages by creation time
        state.messages[message.chatId].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    },
    
    addTempMessage: (state, action: PayloadAction<{ 
      tempId: string; 
      message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> & { 
        id: string; 
        createdAt: Date; 
        updatedAt: Date; 
      };
    }>) => {
      const { tempId, message } = action.payload;
      state.tempMessages[tempId] = message as Message;
      
      // Also add to messages for immediate display
      if (!state.messages[message.chatId]) {
        state.messages[message.chatId] = [];
      }
      state.messages[message.chatId].push(message as Message);
    },
    
    replaceTempMessage: (state, action: PayloadAction<{ 
      tempId: string; 
      realMessage: Message; 
    }>) => {
      const { tempId, realMessage } = action.payload;
      
      // Remove temp message
      delete state.tempMessages[tempId];
      
      // Replace in messages array
      const chatMessages = state.messages[realMessage.chatId];
      if (chatMessages) {
        const tempMessageIndex = chatMessages.findIndex(m => m.id === tempId);
        if (tempMessageIndex !== -1) {
          chatMessages[tempMessageIndex] = realMessage;
        }
      }
    },
    
    removeTempMessage: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      const tempMessage = state.tempMessages[tempId];
      
      if (tempMessage) {
        // Remove from temp messages
        delete state.tempMessages[tempId];
        
        // Remove from messages array
        const chatMessages = state.messages[tempMessage.chatId];
        if (chatMessages) {
          state.messages[tempMessage.chatId] = chatMessages.filter(m => m.id !== tempId);
        }
      }
    },
    
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      chatId: string;
      status: 'sent' | 'delivered' | 'read';
      userId?: string;
    }>) => {
      const { messageId, chatId, status, userId } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        const message = chatMessages.find(m => m.id === messageId);
        if (message) {
          switch (status) {
            case 'delivered':
              message.delivered = true;
              break;
            case 'read':
              message.read = true;
              message.delivered = true;
              break;
          }
        }
      }
    },
    
    updateMessage: (state, action: PayloadAction<Message>) => {
      const updatedMessage = action.payload;
      const chatMessages = state.messages[updatedMessage.chatId];
      
      if (chatMessages) {
        const messageIndex = chatMessages.findIndex(m => m.id === updatedMessage.id);
        if (messageIndex !== -1) {
          chatMessages[messageIndex] = updatedMessage;
        }
      }
    },
    
    removeMessage: (state, action: PayloadAction<{ messageId: string; chatId: string }>) => {
      const { messageId, chatId } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        const messageIndex = chatMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          // Mark as deleted instead of removing
          chatMessages[messageIndex] = {
            ...chatMessages[messageIndex],
            content: 'This message was deleted',
            isDeleted: true,
            deletedAt: new Date()
          } as Message;
        }
      }
    },
    
    addMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      chatId: string;
      emoji: string;
      userId: string;
    }>) => {
      const { messageId, chatId, emoji, userId } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        const message = chatMessages.find(m => m.id === messageId);
        if (message && message.reactions) {
          const existingReaction = message.reactions.find(r => r.emoji === emoji && r.userId === userId);
          if (!existingReaction) {
            message.reactions.push({ emoji, userId });
          }
        }
      }
    },
    
    removeMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      chatId: string;
      emoji: string;
      userId: string;
    }>) => {
      const { messageId, chatId, emoji, userId } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        const message = chatMessages.find(m => m.id === messageId);
        if (message && message.reactions) {
          message.reactions = message.reactions.filter(r => 
            !(r.emoji === emoji && r.userId === userId)
          );
        }
      }
    },
    
    setEditingMessage: (state, action: PayloadAction<{ messageId: string; content: string } | null>) => {
      state.editingMessage = action.payload;
    },
    
    setReplyingTo: (state, action: PayloadAction<Message | null>) => {
      state.replyingTo = action.payload;
    },
    
    clearMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.messages[chatId];
      delete state.hasMore[chatId];
      delete state.currentPage[chatId];
      delete state.searchResults[chatId];
    },
    
    clearSearchResults: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.searchResults[chatId];
    },
    
    addUploadingFile: (state, action: PayloadAction<{ 
      fileId: string; 
      file: File; 
      progress: number; 
    }>) => {
      const { fileId, file, progress } = action.payload;
      state.uploadingFiles[fileId] = { file, progress };
    },
    
    updateUploadProgress: (state, action: PayloadAction<{ 
      fileId: string; 
      progress: number; 
    }>) => {
      const { fileId, progress } = action.payload;
      if (state.uploadingFiles[fileId]) {
        state.uploadingFiles[fileId].progress = progress;
      }
    },
    
    removeUploadingFile: (state, action: PayloadAction<string>) => {
      const fileId = action.payload;
      delete state.uploadingFiles[fileId];
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    markChatMessagesAsRead: (state, action: PayloadAction<{ 
      chatId: string; 
      messageIds: string[]; 
    }>) => {
      const { chatId, messageIds } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        chatMessages.forEach(message => {
          if (messageIds.includes(message.id)) {
            message.read = true;
            message.delivered = true;
          }
        });
      }
    },
    
    optimisticMarkAsRead: (state, action: PayloadAction<{ 
      chatId: string; 
      userId: string; 
    }>) => {
      const { chatId, userId } = action.payload;
      const chatMessages = state.messages[chatId];
      
      if (chatMessages) {
        chatMessages.forEach(message => {
          if (message.senderId !== userId && !message.read) {
            message.read = true;
            message.delivered = true;
          }
        });
      }
    }
  },
  
  extraReducers: (builder) => {
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const isLoadMore = action.meta.arg.page > 1 || !!action.meta.arg.before;
        if (isLoadMore) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        
        const { chatId, messages, page, hasMore, isLoadMore } = action.payload;
        
        if (isLoadMore) {
          // Prepend older messages
          const existingMessages = state.messages[chatId] || [];
          state.messages[chatId] = [...messages, ...existingMessages];
        } else {
          // Replace with new messages
          state.messages[chatId] = messages;
        }
        
        state.hasMore[chatId] = hasMore;
        state.currentPage[chatId] = page;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const { message, tempId } = action.payload;
        
        if (tempId) {
          // Replace temp message with real message
          messageSlice.caseReducers.replaceTempMessage(state, {
            type: 'messages/replaceTempMessage',
            payload: { tempId, realMessage: message }
          });
        } else {
          // Add new message
          messageSlice.caseReducers.addMessage(state, {
            type: 'messages/addMessage',
            payload: message
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        const errorPayload = action.payload as any;
        state.error = errorPayload.error;
        
        if (errorPayload.tempId) {
          // Remove failed temp message
          messageSlice.caseReducers.removeTempMessage(state, {
            type: 'messages/removeTempMessage',
            payload: errorPayload.tempId
          });
        }
      });

    // Edit message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        messageSlice.caseReducers.updateMessage(state, {
          type: 'messages/updateMessage',
          payload: updatedMessage
        });
        state.editingMessage = null;
      });

    // Delete message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, chatId } = action.payload;
        messageSlice.caseReducers.removeMessage(state, {
          type: 'messages/removeMessage',
          payload: { messageId, chatId }
        });
      });

    // Mark as read
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId, messageIds } = action.payload;
        messageSlice.caseReducers.markChatMessagesAsRead(state, {
          type: 'messages/markChatMessagesAsRead',
          payload: { chatId, messageIds }
        });
      });

    // Search messages
    builder
      .addCase(searchMessages.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.isSearching = false;
        const { chatId, messages } = action.payload;
        state.searchResults[chatId] = messages;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addMessage,
  addTempMessage,
  replaceTempMessage,
  removeTempMessage,
  updateMessageStatus,
  updateMessage,
  removeMessage,
  addMessageReaction,
  removeMessageReaction,
  setEditingMessage,
  setReplyingTo,
  clearMessages,
  clearSearchResults,
  addUploadingFile,
  updateUploadProgress,
  removeUploadingFile,
  clearError,
  markChatMessagesAsRead,
  optimisticMarkAsRead
} = messageSlice.actions;

export default messageSlice.reducer;