import React from 'react';
import { Chat } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Users, Pin, VolumeX } from 'lucide-react';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const { typingUsers, onlineUsers } = useSelector((state: RootState) => state.chats);
  const isTyping = typingUsers[chat.id]?.length > 0;

  const getChatName = () => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const otherMember = chat.members[0];
      return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    if (chat.avatar) return chat.avatar;
    
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      return chat.members[0].user.avatar || '/default-avatar.png';
    }
    
    return '/default-group-avatar.png';
  };

  const getLastMessagePreview = () => {
    if (isTyping) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat.members.find(m => m.user.id === userId);
          return member?.user.firstName || 'Someone';
        })
        .join(', ');
      return `${typingUsernames} yazıyor...`;
    }
    
    return chat.lastMessage || 'Henüz mesaj yok';
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    
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
      return messageDate.toLocaleDateString('tr-TR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const isOnline = chat.type === 'DIRECT' && chat.members.length > 0 
    ? onlineUsers.has(chat.members[0].user.id)
    : false;

  const unreadCount = 0; // This would come from the backend

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
          : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={getChatAvatar()}
          alt={getChatName()}
          className="w-12 h-12 rounded-full object-cover"
        />
        
        {/* Online indicator for direct chats */}
        {chat.type === 'DIRECT' && isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
        )}
        
        {/* Group indicator */}
        {chat.type === 'GROUP' && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <h3 className={`font-medium truncate ${
              isActive 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {getChatName()}
            </h3>
            
            {/* Chat indicators */}
            <div className="flex items-center space-x-1">
              {/* Pinned indicator */}
              {false && ( // This would be a property from the chat
                <Pin className="w-3 h-3 text-gray-400" />
              )}
              
              {/* Muted indicator */}
              {false && ( // This would be a property from the chat
                <VolumeX className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className={`text-xs ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {formatTime(chat.lastMessageAt)}
            </span>
            
            {/* Unread count */}
            {unreadCount > 0 && (
              <div className="bg-blue-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className={`text-sm truncate ${
            isTyping 
              ? 'text-blue-500 dark:text-blue-400 italic' 
              : isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            {getLastMessagePreview()}
          </p>

          {/* Message status indicators */}
          {chat.lastMessage && (
            <div className="flex items-center space-x-1 ml-2">
              {/* Delivered/Read indicators would go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;