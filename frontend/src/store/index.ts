// src/store/index.ts - Fixed Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import chatSlice from './slices/chatSlice';
import messageSlice from './slices/messageSlice';

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui state
  blacklist: ['chats', 'messages'], // Don't persist real-time data
};

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  chats: chatSlice,
  messages: messageSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// src/hooks/useTypedSelector.ts - Safe Selector Hook
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Safe UI selector with defaults
export const useUISelector = () => {
  return useAppSelector((state) => {
    // Provide safe defaults if state.ui is undefined
    if (!state.ui) {
      return {
        isDarkMode: false,
        sidebarOpen: true,
        profileModalOpen: false,
        settingsModalOpen: false,
        emojiPickerOpen: false,
        isTyping: false,
        searchQuery: '',
        notifications: [],
      };
    }
    return state.ui;
  });
};

// src/store/slices/uiSlice.ts - Fixed UI Slice with Safe Initialization
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

// Safe localStorage access
const getSafeLocalStorage = (key: string, defaultValue: string = 'false'): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key) || defaultValue;
    }
  } catch (error) {
    console.warn('localStorage access failed:', error);
  }
  return defaultValue;
};

const initialState: UIState = {
  isDarkMode: getSafeLocalStorage('darkMode') === 'true',
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
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('darkMode', state.isDarkMode.toString());
        }
      } catch (error) {
        console.warn('Failed to save dark mode to localStorage:', error);
      }
      
      // Apply dark mode to document
      if (typeof document !== 'undefined') {
        if (state.isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('darkMode', state.isDarkMode.toString());
        }
      } catch (error) {
        console.warn('Failed to save dark mode to localStorage:', error);
      }
      
      if (typeof document !== 'undefined') {
        if (state.isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    // ... other reducers remain the same
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    // Add other reducers here...
  },
});

export const { 
  toggleDarkMode, 
  setDarkMode, 
  toggleSidebar, 
  setSidebarOpen 
} = uiSlice.actions;

export default uiSlice.reducer;