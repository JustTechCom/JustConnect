import axios, { AxiosResponse } from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for auth token
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
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          store.dispatch(setTokens({
            accessToken,
            refreshToken: newRefreshToken,
          }));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API functions
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
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  logout: () => api.post('/auth/logout'),
};

export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  
  updateProfile: (userData: FormData) =>
    api.put('/users/me', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  searchUsers: (query: string) =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`),
  
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  
  createChat: (chatData: {
    type: 'DIRECT' | 'GROUP' | 'CHANNEL';
    memberIds: string[];
    name?: string;
    description?: string;
  }) => api.post('/chats', chatData),
  
  getChatById: (id: string) => api.get(`/chats/${id}`),
  
  updateChat: (id: string, data: any) => api.put(`/chats/${id}`, data),
  
  deleteChat: (id: string) => api.delete(`/chats/${id}`),
  
  addMembers: (chatId: string, memberIds: string[]) =>
    api.post(`/chats/${chatId}/members`, { memberIds }),
  
  removeMember: (chatId: string, userId: string) =>
    api.delete(`/chats/${chatId}/members/${userId}`),
  
  updateMemberRole: (chatId: string, userId: string, role: string) =>
    api.put(`/chats/${chatId}/members/${userId}`, { role }),
  
  leaveChat: (chatId: string) => api.post(`/chats/${chatId}/leave`),
};

export const messageAPI = {
  getMessages: (chatId: string, page = 1, limit = 50) =>
    api.get(`/messages/chat/${chatId}?page=${page}&limit=${limit}`),
  
  sendMessage: (messageData: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }) => api.post('/messages', messageData),
  
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}`, { content }),
  
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
  
  markAsRead: (chatId: string, messageIds: string[]) =>
    api.post(`/messages/read`, { chatId, messageIds }),
  
  uploadFile: (file: File, chatId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    return api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  updateSettings: (settings: any) =>
    api.put('/notifications/settings', settings),
};

export default api;