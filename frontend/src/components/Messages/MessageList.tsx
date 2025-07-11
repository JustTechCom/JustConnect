// frontend/src/components/Messages/MessageList.tsx - Modern Professional Design

import React, { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message, Chat } from '../../types';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import { useInfiniteScroll } from '../../hooks';
import { Loader, ArrowDown, MessageCircle } from 'lucide-react';

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
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  const isTyping = typingUsers[chat.id]?.length > 0;

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [messages]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle scroll button visibility
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const shouldShowAvatar = (message: Message, index: number, dayMessages: Message[]) => {
    if (index === dayMessages.length - 1) return true;
    
    const nextMessage = dayMessages[index + 1];
    return (
      nextMessage.senderId !== message.senderId ||
      new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000 // 5 minutes
    );
  };

  const shouldShowTimestamp = (message: Message, index: number, dayMessages: Message[]) => {
    if (index === 0) return true;
    
    const prevMessage = dayMessages[index - 1];
    const timeDiff = new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Start the conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Send your first message to begin chatting with{' '}
            {chat.type === 'DIRECT' && chat.members.length > 0
              ? `${chat.members[0].user.firstName}`
              : 'this group'
            }
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Load More Indicator */}
        {hasMore && (
          <div className="text-center py-6 animate-slide-up">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <Loader className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Loading previous messages...
                </span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="glass-card-sm px-6 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-white/20 transition-all duration-200 hover:scale-105"
              >
                Load previous messages
              </button>
            )}
          </div>
        )}

        {/* Grouped Messages by Date */}
        {groupedMessages.map(([dateString, dayMessages]) => (
          <div key={dateString} className="space-y-1">
            {/* Date Separator */}
            <div className="flex items-center justify-center my-6">
              <div className="glass-card-sm px-4 py-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {formatDate(dateString)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => (
              <div key={message.id} className="space-y-1">
                {/* Timestamp Separator */}
                {shouldShowTimestamp(message, index, dayMessages) && (
                  <div className="flex items-center justify-center my-4">
                    <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                      {formatTimestamp(message.createdAt)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`animate-slide-up ${
                  message.senderId === user?.id ? 'animate-slide-right' : 'animate-slide-left'
                }`}>
                 <MessageItem
                    message={message}
                    currentUser={user}  // Bu satırı ekle
                    isOwn={message.senderId === user?.id}
                    showAvatar={shouldShowAvatar(message, index)}
                    chat={chat}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="animate-slide-left">
            <TypingIndicator
              chatId={chat.id}
              typingUserIds={typingUsers[chat.id] || []}
            />
          </div>
        )}

        {/* Bottom reference for auto-scroll */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-10 animate-slide-up"
        >
          <ArrowDown className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Loading Overlay */}
      {isLoading && messages.length === 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card-sm p-6 text-center">
            <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Loading messages...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;