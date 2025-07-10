// frontend/src/components/Chat/ChatArea.tsx - Düzeltilmiş message loading

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchMessages } from '../../store/slices/messageSlice';
import { Chat } from '../../types';
import MessageList from '../Messages/MessageList';
import MessageInput from '../Messages/MessageInput';
import ChatHeader from './ChatHeader';
import { useScrollToBottom } from '../../hooks';

interface ChatAreaProps {
  chat: Chat;
}

const ChatArea: React.FC<ChatAreaProps> = React.memo(({ chat }) => {
  const dispatch = useDispatch();
  const { 
    messages, 
    isLoading, 
    hasMore, 
    currentPage,
    error 
  } = useSelector((state: RootState) => state.messages);
  
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  // Memoize chat-specific data
  const chatData = useMemo(() => ({
    messages: messages[chat.id] || [],
    hasMore: hasMore[chat.id] || false,
    page: currentPage[chat.id] || 1
  }), [messages, hasMore, currentPage, chat.id]);

  const { ref: messagesEndRef, scrollToBottom } = useScrollToBottom([chatData.messages]);

  // Debug logs
  useEffect(() => {
    console.log('ChatArea render:', {
      chatId: chat.id,
      chatName: chat.name,
      messagesCount: chatData.messages.length,
      isLoading,
      isAuthenticated,
      hasToken: !!token
    });
  }, [chat.id, chat.name, chatData.messages.length, isLoading, isAuthenticated, token]);

  // Fetch messages when chat changes or when authenticated
  useEffect(() => {
    console.log('🔄 Chat changed or auth updated:', {
      chatId: chat.id,
      isAuthenticated,
      hasToken: !!token,
      currentMessageCount: chatData.messages.length
    });

    // Only fetch if authenticated and has token
    if (chat.id && isAuthenticated && token) {
      console.log('📨 Dispatching fetchMessages for chat:', chat.id);
      dispatch(fetchMessages({ chatId: chat.id, page: 1 }));
    } else if (!isAuthenticated || !token) {
      console.log('⚠️ Not authenticated or no token, skipping message fetch');
    }
  }, [chat.id, dispatch, isAuthenticated, token]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && chatData.hasMore && isAuthenticated && token) {
      console.log('📨 Loading more messages, page:', chatData.page + 1);
      dispatch(fetchMessages({ chatId: chat.id, page: chatData.page + 1 }));
    }
  }, [isLoading, chatData.hasMore, chatData.page, dispatch, chat.id, isAuthenticated, token]);

  // Show loading or error states
  if (!isAuthenticated || !token) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <ChatHeader chat={chat} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Oturum açılıyor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <ChatHeader chat={chat} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Mesajlar yüklenemedi</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => dispatch(fetchMessages({ chatId: chat.id, page: 1 }))}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <ChatHeader key={`header-${chat.id}`} chat={chat} />

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList
          messages={chatData.messages}
          chat={chat}
          isLoading={isLoading}
          hasMore={chatData.hasMore}
          onLoadMore={handleLoadMore}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        key={`input-${chat.id}`}
        chatId={chat.id} 
        onScrollToBottom={scrollToBottom}
        disabled={!isAuthenticated || !token}
      />
    </div>
  );
});

ChatArea.displayName = 'ChatArea';

export default ChatArea;