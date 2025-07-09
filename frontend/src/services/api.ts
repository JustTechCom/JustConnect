// frontend/src/services/api.ts - Enhanced API services
import axios, { AxiosResponse } from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout
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
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  
  updateProfile: (userData: FormData) =>
    api.put('/users/profile', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  searchUsers: (query: string, options?: { limit?: number; exclude?: string[] }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.exclude?.length) params.append('exclude', options.exclude.join(','));
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
  sendFriendRequest: (userId: string) =>
    api.post('/users/friend-request', { userId }),
  
  respondToFriendRequest: (friendshipId: string, action: 'accept' | 'reject') =>
    api.put(`/users/friend-request/${friendshipId}`, { action }),
  
  getFriendRequests: (type: 'sent' | 'received' = 'received') =>
    api.get(`/users/friend-requests?type=${type}`),
  
  getFriends: () => api.get('/users/friends'),
  
  removeFriend: (friendId: string) =>
    api.delete(`/users/friends/${friendId}`),
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
    return api.get(`/messages/chat/${chatId}?${params}`);
  },
  
  sendMessage: (messageData: {
    chatId: string;
    content: string;
    type?: string;
    replyTo?: string;
    fileId?: string;
    tempId?: string;
  }) => api.post('/messages', messageData),
  
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

export const fileAPI = {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  
  getFiles: (options?: { 
    page?: number; 
    limit?: number; 
    type?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.type) params.append('type', options.type);
    return api.get(`/files?${params}`);
  },
  
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  getFileUrl: (fileId: string) => api.get(`/files/${fileId}/url`),
  
  getStorageUsage: () => api.get('/files/storage'),
};

export const notificationAPI = {
  getNotifications: (options?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    return api.get(`/notifications?${params}`);
  },
  
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
  
  updateSettings: (settings: {
    email?: boolean;
    push?: boolean;
    desktop?: boolean;
    sound?: boolean;
  }) => api.put('/notifications/settings', settings),
  
  getSettings: () => api.get('/notifications/settings'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  
  updateSettings: (settings: any) => api.put('/settings', settings),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/settings/password', { currentPassword, newPassword }),
  
  enable2FA: () => api.post('/settings/2fa/enable'),
  
  disable2FA: (code: string) => api.post('/settings/2fa/disable', { code }),
  
  verify2FA: (code: string) => api.post('/settings/2fa/verify', { code }),
  
  downloadData: () => api.get('/settings/download-data', { responseType: 'blob' }),
  
  deleteAccount: (password: string) =>
    api.delete('/settings/account', { data: { password } }),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  getUsers: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.role) params.append('role', options.role);
    return api.get(`/admin/users?${params}`);
  },
  
  getUser: (userId: string) => api.get(`/admin/users/${userId}`),
  
  updateUser: (userId: string, data: any) => api.put(`/admin/users/${userId}`, data),
  
  banUser: (userId: string, reason: string, duration?: number) =>
    api.post(`/admin/users/${userId}/ban`, { reason, duration }),
  
  unbanUser: (userId: string) => api.post(`/admin/users/${userId}/unban`),
  
  getChats: (options?: { page?: number; limit?: number; type?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.type) params.append('type', options.type);
    if (options?.search) params.append('search', options.search);
    return api.get(`/admin/chats?${params}`);
  },
  
  deleteChat: (chatId: string) => api.delete(`/admin/chats/${chatId}`),
  
  getMessages: (options?: {
    page?: number;
    limit?: number;
    chatId?: string;
    userId?: string;
    flagged?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.chatId) params.append('chatId', options.chatId);
    if (options?.userId) params.append('userId', options.userId);
    if (options?.flagged) params.append('flagged', 'true');
    return api.get(`/admin/messages?${params}`);
  },
  
  deleteMessage: (messageId: string) => api.delete(`/admin/messages/${messageId}`),
  
  getAnalytics: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/admin/analytics?${params}`);
  },
  
  getSystemSettings: () => api.get('/admin/settings'),
  
  updateSystemSettings: (settings: any) => api.put('/admin/settings', settings),
  
  sendBroadcast: (data: {
    title: string;
    message: string;
    type: string;
    sendEmail?: boolean;
  }) => api.post('/admin/broadcast', data),
  
  getHealth: () => api.get('/admin/health'),
};

// Utility functions
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value instanceof FileList) {
      Array.from(value).forEach((file, index) => {
        formData.append(`${key}[${index}]`, file);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  return formData;
};

export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export const getFilePreviewUrl = (fileId: string): string => {
  return `${API_BASE_URL}/files/${fileId}/preview`;
};

export const getThumbnailUrl = (fileId: string): string => {
  return `${API_BASE_URL}/files/${fileId}/thumbnail`;
};

// Error handling utility
export const handleApiError = (error: any): string => {
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
  return api.get('/health');
};

export default api;