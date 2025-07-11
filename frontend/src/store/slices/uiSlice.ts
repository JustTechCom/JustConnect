// frontend/src/store/slices/uiSlice.ts - UI State Management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Layout
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  isMobile: boolean;
  
  // Theme
  isDarkMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  
  // Modals
  showUserProfile: boolean;
  showSettings: boolean;
  showNewChatModal: boolean;
  showSearchModal: boolean;
  showEmojiPicker: boolean;
  
  // Notifications
  notifications: Notification[];
  showNotificationPanel: boolean;
  notificationCount: number;
  
  // Loading states
  isGlobalLoading: boolean;
  loadingMessage: string;
  
  // Chat UI
  chatPanelWidth: number;
  messageTextSize: 'small' | 'medium' | 'large';
  showMessageTimestamps: boolean;
  compactMode: boolean;
  
  // Connection status
  isOnline: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastConnected: Date | null;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  
  // Check system preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialSidebarState = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const saved = localStorage.getItem('sidebarOpen');
  if (saved !== null) {
    return JSON.parse(saved);
  }
  
  // Default based on screen size
  return window.innerWidth >= 1024; // lg breakpoint
};

const initialState: UIState = {
  // Layout
  sidebarOpen: getInitialSidebarState(),
  rightPanelOpen: false,
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  
  // Theme
  isDarkMode: getInitialTheme(),
  theme: 'auto',
  primaryColor: '#3b82f6',
  
  // Modals
  showUserProfile: false,
  showSettings: false,
  showNewChatModal: false,
  showSearchModal: false,
  showEmojiPicker: false,
  
  // Notifications
  notifications: [],
  showNotificationPanel: false,
  notificationCount: 0,
  
  // Loading states
  isGlobalLoading: false,
  loadingMessage: '',
  
  // Chat UI
  chatPanelWidth: 320,
  messageTextSize: 'medium',
  showMessageTimestamps: true,
  compactMode: false,
  
  // Connection status
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionStatus: 'connected',
  lastConnected: new Date(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpen', JSON.stringify(state.sidebarOpen));
      }
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpen', JSON.stringify(state.sidebarOpen));
      }
    },
    
    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },
    
    setRightPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.rightPanelOpen = action.payload;
    },
    
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      // Auto-close sidebar on mobile
      if (action.payload) {
        state.sidebarOpen = false;
      }
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      state.theme = state.isDarkMode ? 'dark' : 'light';
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        document.documentElement.classList.toggle('dark', state.isDarkMode);
      }
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      state.theme = action.payload ? 'dark' : 'light';
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        document.documentElement.classList.toggle('dark', state.isDarkMode);
      }
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      
      if (action.payload === 'auto') {
        // Follow system preference
        if (typeof window !== 'undefined') {
          state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      } else {
        state.isDarkMode = action.payload === 'dark';
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
        document.documentElement.classList.toggle('dark', state.isDarkMode);
      }
    },
    
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('primaryColor', action.payload);
        document.documentElement.style.setProperty('--primary-color', action.payload);
      }
    },
    
    // Modal actions
    setShowUserProfile: (state, action: PayloadAction<boolean>) => {
      state.showUserProfile = action.payload;
    },
    
    setShowSettings: (state, action: PayloadAction<boolean>) => {
      state.showSettings = action.payload;
    },
    
    setShowNewChatModal: (state, action: PayloadAction<boolean>) => {
      state.showNewChatModal = action.payload;
    },
    
    setShowSearchModal: (state, action: PayloadAction<boolean>) => {
      state.showSearchModal = action.payload;
    },
    
    setShowEmojiPicker: (state, action: PayloadAction<boolean>) => {
      state.showEmojiPicker = action.payload;
    },
    
    // Close all modals
    closeAllModals: (state) => {
      state.showUserProfile = false;
      state.showSettings = false;
      state.showNewChatModal = false;
      state.showSearchModal = false;
      state.showEmojiPicker = false;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      
      state.notifications.unshift(notification);
      state.notificationCount = state.notifications.filter(n => !n.read).length;
      
      // Auto-remove after 5 seconds for non-error notifications
      if (notification.type !== 'error') {
        setTimeout(() => {
          // This would need to be handled differently in a real app
          // as we can't dispatch from inside a reducer
        }, 5000);
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
      state.notificationCount = state.notifications.filter(n => !n.read).length;
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
        state.notificationCount = state.notifications.filter(n => !n.read).length;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.notificationCount = 0;
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.notificationCount = 0;
    },
    
    setShowNotificationPanel: (state, action: PayloadAction<boolean>) => {
      state.showNotificationPanel = action.payload;
    },
    
    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
      state.isGlobalLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Chat UI actions
    setChatPanelWidth: (state, action: PayloadAction<number>) => {
      state.chatPanelWidth = Math.max(280, Math.min(500, action.payload));
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatPanelWidth', state.chatPanelWidth.toString());
      }
    },
    
    setMessageTextSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.messageTextSize = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('messageTextSize', action.payload);
      }
    },
    
    toggleMessageTimestamps: (state) => {
      state.showMessageTimestamps = !state.showMessageTimestamps;
      if (typeof window !== 'undefined') {
        localStorage.setItem('showMessageTimestamps', JSON.stringify(state.showMessageTimestamps));
      }
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('compactMode', JSON.stringify(state.compactMode));
      }
    },
    
    // Connection status actions
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload) {
        state.connectionStatus = 'connected';
        state.lastConnected = new Date();
      }
    },
    
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>) => {
      state.connectionStatus = action.payload;
      if (action.payload === 'connected') {
        state.isOnline = true;
        state.lastConnected = new Date();
      } else if (action.payload === 'disconnected') {
        state.isOnline = false;
      }
    },
    
    // Reset UI state (useful for logout)
    resetUIState: (state) => {
      return {
        ...initialState,
        isDarkMode: state.isDarkMode, // Keep theme preference
        theme: state.theme,
        primaryColor: state.primaryColor,
        messageTextSize: state.messageTextSize,
        showMessageTimestamps: state.showMessageTimestamps,
        compactMode: state.compactMode,
      };
    },
  },
});

export const {
  // Layout
  toggleSidebar,
  setSidebarOpen,
  toggleRightPanel,
  setRightPanelOpen,
  setIsMobile,
  
  // Theme
  toggleDarkMode,
  setDarkMode,
  setTheme,
  setPrimaryColor,
  
  // Modals
  setShowUserProfile,
  setShowSettings,
  setShowNewChatModal,
  setShowSearchModal,
  setShowEmojiPicker,
  closeAllModals,
  
  // Notifications
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  setShowNotificationPanel,
  
  // Loading
  setGlobalLoading,
  
  // Chat UI
  setChatPanelWidth,
  setMessageTextSize,
  toggleMessageTimestamps,
  toggleCompactMode,
  
  // Connection
  setIsOnline,
  setConnectionStatus,
  
  // Reset
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectIsDarkMode = (state: { ui: UIState }) => state.ui.isDarkMode;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectIsMobile = (state: { ui: UIState }) => state.ui.isMobile;
export const selectNotificationCount = (state: { ui: UIState }) => state.ui.notificationCount;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectConnectionStatus = (state: { ui: UIState }) => state.ui.connectionStatus;