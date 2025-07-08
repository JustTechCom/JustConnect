import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Reducers (these would be imported from separate files)
const authReducer = (state = { user: null, token: null, isAuthenticated: false }, action: any) => {
  switch (action.type) {
    case 'auth/login':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true };
    case 'auth/logout':
      return { user: null, token: null, isAuthenticated: false };
    default:
      return state;
  }
};

const chatReducer = (state = { chats: [], activeChat: null }, action: any) => {
  switch (action.type) {
    case 'chats/setChats':
      return { ...state, chats: action.payload };
    case 'chats/setActiveChat':
      return { ...state, activeChat: action.payload };
    default:
      return state;
  }
};

const messageReducer = (state = { messages: {} }, action: any) => {
  switch (action.type) {
    case 'messages/addMessage':
      const { chatId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), message]
        }
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  auth: authReducer,
  chats: chatReducer,
  messages: messageReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;