import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  profileModalOpen: boolean;
  settingsModalOpen: boolean;
  emojiPickerOpen: boolean;
  isTyping: boolean;
  searchQuery: string;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const initialState: UIState = {
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: true,
  profileModalOpen: false,
  settingsModalOpen: false,
  emojiPickerOpen: false,
  isTyping: false,
  searchQuery: '',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('darkMode', state.isDarkMode.toString());
      
      // Apply dark mode to document
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      localStorage.setItem('darkMode', state.isDarkMode.toString());
      
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleProfileModal: (state) => {
      state.profileModalOpen = !state.profileModalOpen;
    },
    setProfileModalOpen: (state, action: PayloadAction<boolean>) => {
      state.profileModalOpen = action.payload;
    },
    toggleSettingsModal: (state) => {
      state.settingsModalOpen = !state.settingsModalOpen;
    },
    setSettingsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsModalOpen = action.payload;
    },
    toggleEmojiPicker: (state) => {
      state.emojiPickerOpen = !state.emojiPickerOpen;
    },
    setEmojiPickerOpen: (state, action: PayloadAction<boolean>) => {
      state.emojiPickerOpen = action.payload;
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  toggleProfileModal,
  setProfileModalOpen,
  toggleSettingsModal,
  setSettingsModalOpen,
  toggleEmojiPicker,
  setEmojiPickerOpen,
  setIsTyping,
  setSearchQuery,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;