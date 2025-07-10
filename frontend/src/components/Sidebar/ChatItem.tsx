// frontend/src/components/Sidebar/ChatItem.tsx - Modern Professional Design

import React, { useMemo } from 'react';
import { Chat } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  Users, 
  Pin, 
  VolumeX, 
  Check, 
  CheckCheck,
  Clock,
  Star,
  Archive,
  Camera,
  File,
  Mic,
  MapPin
} from 'lucide-react';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = React.memo(({ chat, isActive, onClick }) => {
  const { typingUsers, onlineUsers } = useSelector((state: RootState) => state.chats);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const isTyping = typingUsers[chat.id]?.length > 0;

  const chatData = useMemo(() => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const otherMember = chat.members.find(member => member.user.id !== currentUser?.id);
      
      if (otherMember) {
        return {
          name: `${otherMember.user.firstName} ${otherMember.user.lastName}`,
          avatar: otherMember.user.avatar || '/default-avatar.png',
          isOnline: onlineUsers.has(otherMember.user.id),
          userId: otherMember.user.id
        };
      }
    }
    
    return {
      name: chat.name || 'Unnamed Chat',
      avatar: chat.avatar || '/default-group-avatar.png',
      isOnline: false,
      userId: null
    };
  }, [chat, currentUser?.id, onlineUsers]);

  const lastMessagePreview = useMemo(() => {
    if (isTyping) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat.members.find(m => m.user.id === userId);
          return member?.user.firstName || 'Someone';
        })
        .join(', ');
      return `${typingUsernames} is typing...`;
    }
    
    if (chat.lastMessage) {
      // Parse message type for icons
      const messageType = chat.lastMessageType || 'TEXT';
      switch (messageType) {
        case 'IMAGE':
          return (
            <span className="flex items-center space-x-1">
              <Camera className="w-3 h-3 text-gray-400" />
              <span>Photo</span>
            </span>
          );
        case 'FILE':
          return (
            <span className="flex items-center space-x-1">
              <File className="w-3 h-3 text-gray-400" />
              <span>File</span>
            </span>
          );
        case 'AUDIO':
          return (
            <span className="flex items-center space-x-1">
              <Mic className="w-3 h-3 text-gray-400" />
              <span>Voice message</span>
            </span>
          );
        case 'LOCATION':
          return (
            <span className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>Location</span>
            </span>
          );
        default:
          return chat.lastMessage;
      }
    }
    
    return 'No messages yet';
  }, [isTyping, typingUsers, chat]);

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short' 
      });
    }
  };

  const unreadCount = chat.unreadCount || 0;
  const isLastMessageFromMe = chat.lastMessageSenderId === currentUser?.id;

  return (
    <div
      onClick={onClick}
      className={`chat-item group cursor-pointer ${isActive ? 'active' : ''}`}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          <div className="avatar">
            <img
              src={chatData.avatar}
              alt={chatData.name}
              className="w-12 h-12 rounded-xl object-cover"
              loading="lazy"
            />
            
            {/* Online Status for Direct Chats */}
            {chat.type === 'DIRECT' && chatData.isOnline && (
              <div className="status-indicator status-online"></div>
            )}
            
            {/* Group Badge */}
            {chat.type === 'GROUP' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            {/* Chat Name & Indicators */}
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <h3 className={`font-semibold truncate transition-colors ${
                isActive 
                  ? 'text-indigo-700 dark:text-indigo-300' 
                  : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}>
                {chatData.name}
              </h3>
              
              {/* Chat Status Indicators */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {chat.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-500" />
                )}
                {chat.isMuted && (
                  <VolumeX className="w-3 h-3 text-gray-400" />
                )}
                {chat.isArchived && (
                  <Archive className="w-3 h-3 text-gray-400" />
                )}
                {chat.isStarred && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
            </div>

            {/* Time & Unread Count */}
            <div className="flex flex-col items-end space-y-1">
              <span className={`text-xs font-medium ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : unreadCount > 0
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(chat.lastMessageAt)}
              </span>
              
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
          </div>

          {/* Last Message Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 min-w-0 flex-1">
              {/* Message Status for Sent Messages */}
              {isLastMessageFromMe && !isTyping && (
                <div className="flex-shrink-0">
                  {chat.lastMessageStatus === 'read' ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : chat.lastMessageStatus === 'delivered' ? (
                    <CheckCheck className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              )}
              
              {/* Message Preview */}
              <p className={`text-sm truncate ${
                isTyping 
                  ? 'text-indigo-500 dark:text-indigo-400 italic animate-pulse' 
                  : unreadCount > 0
                    ? 'text-gray-900 dark:text-white font-medium'
                    : isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400'
              }`}>
                {lastMessagePreview}
              </p>
            </div>

            {/* Additional Indicators */}
            <div className="flex items-center space-x-1 ml-2">
              {/* Typing Dots */}
              {isTyping && (
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
              
              {/* Draft Indicator */}
              {chat.hasDraft && (
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center space-x-1">
          <button className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <Pin className="w-3 h-3 text-gray-400 hover:text-yellow-500" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <Archive className="w-3 h-3 text-gray-400 hover:text-indigo-500" />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';

export default ChatItem;