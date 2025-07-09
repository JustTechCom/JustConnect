// frontend/src/services/api.ts - Updated API configuration
import axios, { AxiosResponse } from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

// Enhanced API URL configuration with fallbacks
const getApiBaseUrl = (): string => {
  // Check environment variables in order of preference
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production URL
  if (window.location.hostname.includes('justconnect-ui.onrender.com')) {
    return 'https://justconnect-o8k8.onrender.com/api';
  }
  
  // Development fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false, // Set to false for cross-origin requests
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding auth token to request:', config.url);
    } else {
      console.warn('⚠️ No auth token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          console.log('🔄 Attempting token refresh...');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          store.dispatch(setTokens({
            accessToken,
            refreshToken: newRefreshToken,
          }));

          console.log('✅ Token refreshed successfully');

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Refresh failed, redirect to login
          store.dispatch(logout());
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('⚠️ No refresh token, redirecting to login');
        // No refresh token, redirect to login
        store.dispatch(logout());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API functions with enhanced error handling
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('🔐 Attempting login for:', credentials.email);
    return api.post('/auth/login', credentials);
  },
  
  register: (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => {
    console.log('📝 Attempting registration for:', userData.email);
    return api.post('/auth/register', userData);
  },
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const userAPI = {
  getCurrentUser: () => {
    console.log('👤 Fetching current user...');
    return api.get('/users/me');
  },
  
  updateProfile: (userData: FormData) => {
    console.log('📝 Updating user profile...');
    return api.put('/users/profile', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  searchUsers: (query: string, options?: { limit?: number; exclude?: string[] }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.exclude?.length) params.append('exclude', options.exclude.join(','));
    console.log('🔍 Searching users:', query);
    return api.get(`/users/search?${params}`);
  },
  
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Friend system
  sendFriendRequest: (userId: string) => {
    console.log('🤝 Sending friend request to:', userId);
    return api.post('/users/friend-request', { userId });
  },
  
  respondToFriendRequest: (friendshipId: string, action: 'accept' | 'reject') => {
    console.log('🤝 Responding to friend request:', friendshipId, action);
    return api.put(`/users/friend-request/${friendshipId}`, { action });
  },
  
  getFriendRequests: (type: 'sent' | 'received' = 'received') => {
    console.log('🤝 Fetching friend requests:', type);
    return api.get(`/users/friend-requests?type=${type}`);
  },
  
  getFriends: () => {
    console.log('👥 Fetching friends list...');
    return api.get('/users/friends');
  },
  
  removeFriend: (friendId: string) =>
    api.delete(`/users/friends/${friendId}`),
};

export const chatAPI = {
  getChats: () => {
    console.log('💬 Fetching user chats...');
    return api.get('/chats');
  },
  
  createChat: (chatData: {
    type: 'DIRECT' | 'GROUP' | 'CHANNEL';
    memberIds: string[];
    name?: string;
    description?: string;
  }) => {
    console.log('💬 Creating chat:', chatData.type);
    return api.post('/chats', chatData);
  },
  
  getChatById: (id: string) => api.get(`/chats/${id}`),
  
  updateChat: (id: string, data: {
    name?: string;
    description?: string;
    avatar?: string;
  }) => api.put(`/chats/${id}`, data),
  
  deleteChat: (id: string) => api.delete(`/chats/${id}`),
  
  addMembers: (chatId: string, memberIds: string[]) =>
    api.post(`/chats/${chatId}/members`, { memberIds }),
  
  removeMember: (chatId: string, userId: string) =>
    api.delete(`/chats/${chatId}/members/${userId}`),
  
  updateMemberRole: (chatId: string, userId: string, role: string) =>
    api.put(`/chats/${chatId}/members/${userId}`, { role }),
  
  leaveChat: (chatId: string) => api.post(`/chats/${chatId}/leave`),
  
  pinChat: (chatId: string) => api.put(`/chats/${chatId}/pin`),
  
  archiveChat: (chatId: string) => api.put(`/chats/${chatId}/archive`),
  
  muteChat: (chatId: string, duration?: number) =>
    api.put(`/chats/${chatId}/mute`, { duration }),
};

export const messageAPI = {
  getMessages: (chatId: string, options?: { 
    page?: number; 
    limit?: number; 
    before?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);
    console.log('📨 Fetching messages for chat:', chatId);
    return api.get(`/messages/chat/${chatId}?${params}`);
  },
  
  sendMessage: (messageData: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
    fileId?: string;
    tempId?: string;
  }) => {
    console.log('📨 Sending message to chat:', messageData.chatId);
    return api.post('/messages', messageData);
  },
  
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}`, { content }),
  
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
  
  markAsRead: (chatId: string, messageIds: string[]) =>
    api.post('/messages/mark-read', { chatId, messageIds }),
  
  searchMessages: (chatId: string, query: string, limit = 20) =>
    api.get(`/messages/chat/${chatId}/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  
  addReaction: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reaction`, { emoji }),
  
  removeReaction: (messageId: string, emoji: string) =>
    api.delete(`/messages/${messageId}/reaction`, { data: { emoji } }),
  
  uploadFile: (file: File, chatId: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    
    return api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  console.error('🚨 API Error Details:', error);
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// Health check
export const healthCheck = (): Promise<AxiosResponse> => {
  console.log('🏥 Performing health check...');
  return api.get('/health');
};

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Testing API connection...');
    await healthCheck();
    console.log('✅ API connection successful');
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
};

export default api;