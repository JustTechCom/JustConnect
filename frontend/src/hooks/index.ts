import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setIsTyping } from '../store/slices/uiSlice';
import socketService from '../services/socketService';

export const useTyping = (chatId: string | null) => {
  const dispatch = useDispatch();
  const [isTyping, setLocalIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { typingUsers } = useSelector((state: RootState) => state.chats);

  const startTyping = () => {
    if (!chatId) return;

    if (!isTyping) {
      setLocalIsTyping(true);
      dispatch(setIsTyping(true));
      socketService.startTyping(chatId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
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
  const { onlineUsers } = useSelector((state: RootState) => state.chats);

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
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/badge-icon.png',
        ...options,
      });
    }
    return null;
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
};

export const useScrollToBottom = (dependency: any[]) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, dependency);

  const scrollToBottom = () => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return { ref, scrollToBottom };
};

export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      if (loading || !hasMore) return;

      if (element.scrollTop === 0) {
        callback();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore, loading]);

  return ref;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export const useKeyboardShortcuts = (shortcuts: { [key: string]: () => void }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      
      // Build shortcut string
      let shortcut = '';
      if (ctrlKey || metaKey) shortcut += 'ctrl+';
      if (shiftKey) shortcut += 'shift+';
      if (altKey) shortcut += 'alt+';
      shortcut += key.toLowerCase();

      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};