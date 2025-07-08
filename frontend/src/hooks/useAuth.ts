import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { fetchChats } from '../store/slices/chatSlice';
import { setDarkMode } from '../store/slices/uiSlice';
import socketService from '../services/socketService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Initialize dark mode from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    dispatch(setDarkMode(darkMode));

    // If we have a token but no user, fetch current user
    if (token && !user && isAuthenticated) {
      dispatch(fetchCurrentUser());
    }

    // Connect to socket if authenticated
    if (isAuthenticated && token) {
      socketService.connect(token);
      
      // Fetch user's chats
      dispatch(fetchChats());
    }

    // Cleanup socket on unmount or when not authenticated
    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [dispatch, token, user, isAuthenticated]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
  };
};