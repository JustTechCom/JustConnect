// frontend/src/components/Chat/ChatArea.tsx - Düzeltilmiş versiyon

import React, { useEffect, useRef, useMemo } from 'react';
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
    currentPage 
  } = useSelector((state: RootState) => state.messages);
  
  // Memoize chat-specific data
  const chatData = useMemo(() => ({
    messages: messages[chat.id] || [],
    hasMore: hasMore[chat.id] || false,
    page: currentPage[chat.id] || 1
  }), [messages, hasMore, currentPage, chat.id]);

  const { ref: messagesEndRef, scrollToBottom } = useScrollToBottom([chatData.messages]);

  useEffect(() => {
    // Fetch initial messages when chat changes
    if (chat.id && chatData.messages.length === 0) {
      dispatch(fetchMessages({ chatId: chat.id, page: 1 }));
    }
  }, [chat.id, dispatch, chatData.messages.length]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && chatData.hasMore) {
      dispatch(fetchMessages({ chatId: chat.id, page: chatData.page + 1 }));
    }
  }, [isLoading, chatData.hasMore, chatData.page, dispatch, chat.id]);

  // Debug log to check if component renders multiple times
  console.log('ChatArea render:', chat.id, chat.name);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header - sadece bir kez render et */}
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
      />
    </div>
  );
});

ChatArea.displayName = 'ChatArea';

export default ChatArea;