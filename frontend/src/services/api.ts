// frontend/src/services/api.ts - Düzeltilmiş token handling

import axios, { AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, setTokens } from '../store/slices/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://justconnect-o8k8.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - her request'te token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Adding auth token to request:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
    } else {
      console.log('⚠️ No auth token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - 403/401 hatalarını yakala
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status);
    console.error('❌ Error details:', error.response?.data);
    
    const originalRequest = error.config;

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('🔄 Token expired, attempting refresh...');
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          console.log('🔄 Sending refresh request...');
          
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          
          console.log('✅ Token refreshed successfully');
          
          // Store'u güncelle
          store.dispatch(setTokens({
            accessToken,
            refreshToken: newRefreshToken,
          }));

          // LocalStorage'ı güncelle
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Original request'i yeni token ile tekrar dene
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Refresh başarısız, logout et
          store.dispatch(logout());
          
          // Login sayfasına yönlendir
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        console.log('❌ No refresh token available');
        
        // Refresh token yok, logout et
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
    api.put('/users/profile', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  searchUsers: (query: string, options?: { limit?: number }) =>
    api.get('/users/search', { 
      params: { q: query, ...options } 
    }),
  
  getFriends: () => api.get('/users/friends'),
  
  sendFriendRequest: (userId: string) =>
    api.post('/users/friend-request', { userId }),
  
  respondToFriendRequest: (friendshipId: string, action: 'accept' | 'reject') =>
    api.post(`/users/friend-request/${friendshipId}/${action}`),
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  
  createChat: (data: {
    type: 'DIRECT' | 'GROUP' | 'CHANNEL';
    memberIds: string[];
    name?: string;
    description?: string;
  }) => api.post('/chats', data),
  
  getChatMembers: (chatId: string) =>
    api.get(`/chats/${chatId}/members`),
};

export const messageAPI = {
  getMessages: (chatId: string, page: number = 1, limit: number = 50) =>
    api.get(`/messages/chat/${chatId}`, { 
      params: { page, limit } 
    }),
  
  sendMessage: (data: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }) => api.post('/messages', data),
  
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}`, { content }),
  
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
};

export default api;