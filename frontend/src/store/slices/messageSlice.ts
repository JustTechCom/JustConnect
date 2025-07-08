import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';
import api from '../../services/api';

interface MessageState {
  messages: { [chatId: string]: Message[] };
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: { [chatId: string]: boolean };
  currentPage: { [chatId: string]: number };
}

const initialState: MessageState = {
  messages: {},
  isLoading: false,
  isSending: false,
  error: null,
  hasMore: {},
  currentPage: {},
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ chatId, page = 1 }: { chatId: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/chat/${chatId}?page=${page}&limit=50`);
      return {
        chatId,
        messages: response.data.messages,
        page,
        hasMore: response.data.messages.length === 50,
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
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/messages', messageData);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
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
      state.messages[message.chatId].push(message);
    },
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      chatId: string;
      status: 'sent' | 'delivered' | 'read';
    }>) => {
      const { messageId, chatId, status } = action.payload;
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
    markMessagesAsRead: (state, action: PayloadAction<{ chatId: string; messageIds: string[] }>) => {
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
    editMessage: (state, action: PayloadAction<{ messageId: string; chatId: string; content: string }>) => {
      const { messageId, chatId, content } = action.payload;
      const chatMessages = state.messages[chatId];
      if (chatMessages) {
        const message = chatMessages.find(m => m.id === messageId);
        if (message) {
          message.content = content;
          message.edited = true;
          message.updatedAt = new Date();
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ messageId: string; chatId: string }>) => {
      const { messageId, chatId } = action.payload;
      const chatMessages = state.messages[chatId];
      if (chatMessages) {
        state.messages[chatId] = chatMessages.filter(m => m.id !== messageId);
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.messages[chatId];
      delete state.hasMore[chatId];
      delete state.currentPage[chatId];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { chatId, messages, page, hasMore } = action.payload;
        
        if (page === 1) {
          state.messages[chatId] = messages;
        } else {
          // Prepend older messages
          state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
        }
        
        state.hasMore[chatId] = hasMore;
        state.currentPage[chatId] = page;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
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
        // Message will be added via socket event
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addMessage,
  updateMessageStatus,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  clearMessages,
  clearError,
} = messageSlice.actions;

export default messageSlice.reducer;