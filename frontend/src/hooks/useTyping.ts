// frontend/src/hooks/useTyping.ts - Typing Indicator Hook
import React, { useCallback, useRef } from 'react';
import socketService from '../services/socketService';

interface UseTypingReturn {
  startTyping: () => void;
  stopTyping: () => void;
  isTyping: boolean;
}

export const useTyping = (chatId: string): UseTypingReturn => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const startTyping = useCallback(() => {
    if (!chatId) return;

    // Only send if not already typing
    if (!isTypingRef.current) {
      socketService.startTyping(chatId);
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatId]);

  const stopTyping = useCallback(() => {
    if (!chatId) return;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Only send if currently typing
    if (isTypingRef.current) {
      socketService.stopTyping(chatId);
      isTypingRef.current = false;
    }
  }, [chatId]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        socketService.stopTyping(chatId);
      }
    };
  }, [chatId]);

  return {
    startTyping,
    stopTyping,
    isTyping: isTypingRef.current,
  };
};