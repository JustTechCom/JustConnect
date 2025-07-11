// frontend/src/components/Chat/MessageList.tsx - Message List Component
import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message } from '../../types';
import MessageItem from './MessageItem';
import { fetchMessages } from '../../store/slices/messageSlice';
import { 
  Loader, 
  MessageCircle, 
  ArrowDown,
  Clock,
  CheckCheck,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MessageListProps {
  chatId: string;
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ chatId, messages, isLoading }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { hasMore, isLoadingHistory } = useSelector((state: RootState) => state.messages);
  const { isOnline } = useSelector((state: RootState) => state.ui);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [isNearBottom, setIsNearBottom] = React.useState(true);

  // Handle scroll events
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsNearBottom(isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore[chatId] && !isLoadingHistory[chatId]) {
      dispatch(fetchMessages({ chatId, page: Math.ceil(messages.length / 50) + 1 }) as any);
    }
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Auto scroll to bottom for new messages (only if user is near bottom)
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages.length, isNearBottom]);

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDateGroup = (dateString: string) => {
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

  const groupedMessages = groupMessagesByDate(messages);
  const dateGroups = Object.keys(groupedMessages).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Check if message should show avatar
  const shouldShowAvatar = (message: Message, index: number, dayMessages: Message[]) => {
    if (message.senderId === user?.id) return false; // Don't show avatar for own messages
    
    const nextMessage = dayMessages[index + 1];
    if (!nextMessage) return true;
    
    // Show avatar if next message is from different sender or time gap > 5 minutes
    const timeDiff = new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime();
    return nextMessage.senderId !== message.senderId || timeDiff > 5 * 60 * 1000;
  };

  // Check if message should show time
  const shouldShowTime = (message: Message, index: number, dayMessages: Message[]) => {
    const nextMessage = dayMessages[index + 1];
    if (!nextMessage) return true;
    
    // Show time if next message is from different sender or time gap > 5 minutes
    const timeDiff = new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime();
    return nextMessage.senderId !== message.senderId || timeDiff > 5 * 60 * 1000;
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            No messages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start the conversation by sending your first message!
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Messages are end-to-end encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Connection Status */}
      {!isOnline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center space-x-2 shadow-lg">
            <WifiOff className="w-4 h-4" />
            <span>No internet connection</span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin px-6 py-4"
      >
        {/* Load More Indicator */}
        {isLoadingHistory[chatId] && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading older messages...</span>
            </div>
          </div>
        )}

        {/* Messages grouped by date */}
        {dateGroups.map(dateGroup => (
          <div key={dateGroup} className="mb-6">
            {/* Date Separator */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 dark:border-gray-700/20 shadow-sm">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {formatDateGroup(dateGroup)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-1">
              {groupedMessages[dateGroup].map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                  showAvatar={shouldShowAvatar(message, index, groupedMessages[dateGroup])}
                  showTime={shouldShowTime(message, index, groupedMessages[dateGroup])}
                />
              ))}
            </div>
          </div>
        ))}

        {/* End of messages indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
            <CheckCheck className="w-4 h-4" />
            <span className="text-xs">All messages loaded</span>
          </div>
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-10"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;