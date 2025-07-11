// frontend/src/hooks/index.ts - EMERGENCY SAFE SELECTORS
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import setIsTyping from '../store/slices/uiSlice';
import socketService from '../services/socketService';

export const useTyping = (chatId: string | null) => {
  const dispatch = useDispatch();
  const [isTyping, setLocalIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // SAFE SELECTOR - with fallback
  const typingUsers = useSelector((state: RootState) => state.chats?.typingUsers || {});

  const startTyping = () => {
    if (!chatId) return;

    if (!isTyping) {
      setLocalIsTyping(true);
      dispatch(setIsTyping(true));
      socketService.startTyping(chatId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!chatId) return;

    if (isTyping) {
      setLocalIsTyping(false);
      dispatch(setIsTyping(false));
      socketService.stopTyping(chatId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const otherUsersTyping = chatId ? typingUsers[chatId] || [] : [];

  return {
    isTyping,
    startTyping,
    stopTyping,
    otherUsersTyping,
  };
};

export const useOnlineStatus = () => {
  // SAFE SELECTORS - with fallbacks
  const onlineUsers = useSelector((state: RootState) => {
    const chats = state.chats;
    if (!chats) return new Set<string>();
    return chats.onlineUsers || new Set<string>();
  });

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers,
    isUserOnline,
  };
};

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
  };
};

export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useScrollToBottom = (dependencies: any[] = []) => {
  const ref = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, dependencies);

  return { ref, scrollToBottom };
};

export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      if (element.scrollTop === 0 && hasMore && !isLoading) {
        callback();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore, isLoading]);

  return ref;
};