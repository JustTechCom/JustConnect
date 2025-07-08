import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import messageSlice from './slices/messageSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chats: chatSlice,
    messages: messageSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;