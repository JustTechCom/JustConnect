import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message, Chat } from '../../types';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import { useInfiniteScroll } from '../../hooks';
import { Loader } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  chat: Chat;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  chat,
  isLoading,
  hasMore,
  onLoadMore
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { typingUsers } = useSelector((state: RootState) => state.chats);
  
  const scrollRef = useInfiniteScroll(onLoadMore, hasMore, isLoading);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isTyping = typingUsers[chat.id]?.length > 0;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const shouldShowAvatar = (message: Message, index: number) => {
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    return (
      nextMessage.senderId !== message.senderId ||
      new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000 // 5 minutes
    );
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

  const formatTimestamp = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('tr-TR', { 
        weekday: 'long',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return messageDate.toLocaleDateString('tr-TR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Henüz mesaj bulunmuyor
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            İlk mesajı göndererek sohbeti başlatın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Load More Indicator */}
      {hasMore && (
        <div className="text-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Eski mesajlar yükleniyor...
              </span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Daha eski mesajları yükle
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <div key={message.id}>
          {/* Timestamp Separator */}
          {shouldShowTimestamp(message, index) && (
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(message.createdAt)}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          <MessageItem
            message={message}
            isOwn={message.senderId === user?.id}
            showAvatar={shouldShowAvatar(message, index)}
            chat={chat}
          />
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <TypingIndicator
          chatId={chat.id}
          typingUserIds={typingUsers[chat.id] || []}
        />
      )}

      {/* Bottom reference for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;