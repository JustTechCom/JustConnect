import React, { useEffect, useRef } from 'react';
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

const ChatArea: React.FC<ChatAreaProps> = ({ chat }) => {
  const dispatch = useDispatch();
  const { 
    messages, 
    isLoading, 
    hasMore, 
    currentPage 
  } = useSelector((state: RootState) => state.messages);
  
  const chatMessages = messages[chat.id] || [];
  const hasMoreMessages = hasMore[chat.id] || false;
  const page = currentPage[chat.id] || 1;

  const { ref: messagesEndRef, scrollToBottom } = useScrollToBottom([chatMessages]);

  useEffect(() => {
    // Fetch initial messages when chat changes
    if (chat.id && (!chatMessages.length || chatMessages.length === 0)) {
      dispatch(fetchMessages({ chatId: chat.id, page: 1 }));
    }
  }, [chat.id, dispatch]);

  const handleLoadMore = () => {
    if (!isLoading && hasMoreMessages) {
      dispatch(fetchMessages({ chatId: chat.id, page: page + 1 }));
    }
  };

  const handleSendMessage = (content: string, replyTo?: string) => {
    // Message sending is handled by MessageInput component
    // This triggers the socket event and the message appears via real-time updates
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <ChatHeader chat={chat} />

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList
          messages={chatMessages}
          chat={chat}
          isLoading={isLoading}
          hasMore={hasMoreMessages}
          onLoadMore={handleLoadMore}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        chatId={chat.id} 
        onScrollToBottom={scrollToBottom}
      />
    </div>
  );
};

export default ChatArea;