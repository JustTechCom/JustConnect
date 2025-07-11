// frontend/src/services/api.ts - API service layer
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => api.post('/auth/register', userData),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),

  updateProfile: (data: FormData) =>
    api.put('/users/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  searchUsers: (query: string) =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`),

  getUserById: (userId: string) => api.get(`/users/${userId}`),

  getFriends: () => api.get('/users/friends'),

  getFriendRequests: (type: 'sent' | 'received') =>
    api.get(`/users/friend-requests?type=${type}`),

  sendFriendRequest: (userId: string) =>
    api.post('/users/friend-requests', { userId }),

  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') =>
    api.put(`/users/friend-requests/${requestId}`, { action }),

  blockUser: (userId: string) => api.post(`/users/${userId}/block`),

  unblockUser: (userId: string) => api.delete(`/users/${userId}/block`),

  getBlockedUsers: () => api.get('/users/blocked'),
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chats'),

  getChatById: (chatId: string) => api.get(`/chats/${chatId}`),

  createDirectChat: (userId: string) =>
    api.post('/chats', { type: 'DIRECT', participantId: userId }),

  createGroupChat: (name: string, description?: string, memberIds?: string[]) =>
    api.post('/chats', {
      type: 'GROUP',
      name,
      description,
      memberIds,
    }),

  updateChat: (chatId: string, data: { name?: string; description?: string; avatar?: string }) =>
    api.put(`/chats/${chatId}`, data),

  deleteChat: (chatId: string) => api.delete(`/chats/${chatId}`),

  addMembers: (chatId: string, memberIds: string[]) =>
    api.post(`/chats/${chatId}/members`, { memberIds }),

  removeMember: (chatId: string, memberId: string) =>
    api.delete(`/chats/${chatId}/members/${memberId}`),

  getChatMembers: (chatId: string) => api.get(`/chats/${chatId}/members`),

  leaveChat: (chatId: string) => api.post(`/chats/${chatId}/leave`),

  getChatSettings: (chatId: string) => api.get(`/chats/${chatId}/settings`),

  updateChatSettings: (chatId: string, settings: any) =>
    api.put(`/chats/${chatId}/settings`, settings),
};

// Message API
export const messageAPI = {
  getMessages: (chatId: string, page = 1, limit = 50) =>
    api.get(`/messages/chat/${chatId}?page=${page}&limit=${limit}`),

  sendMessage: (data: {
    chatId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
    replyTo?: string;
  }) => api.post('/messages', data),

  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),

  markAsRead: (messageId: string) =>
    api.post(`/messages/${messageId}/read`),

  getMessageById: (messageId: string) => api.get(`/messages/${messageId}`),

  searchMessages: (chatId: string, query: string) =>
    api.get(`/messages/search?chatId=${chatId}&q=${encodeURIComponent(query)}`),

  uploadFile: (file: File, chatId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    
    return api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addReaction: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),

  removeReaction: (messageId: string, emoji: string) =>
    api.delete(`/messages/${messageId}/reactions/${emoji}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (page = 1, limit = 20) =>
    api.get(`/notifications?page=${page}&limit=${limit}`),

  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  updateSettings: (settings: any) =>
    api.put('/notifications/settings', settings),

  getSettings: () => api.get('/notifications/settings'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  ping: () => api.get('/ping'),
};

export default api;