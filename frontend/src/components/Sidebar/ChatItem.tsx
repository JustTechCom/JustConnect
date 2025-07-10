// frontend/src/components/Sidebar/ChatItem.tsx - Tam Düzeltilmiş Versiyon

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
  const isTyping = typingUsers?.[chat.id]?.length > 0;

  const getChatName = () => {
    // 1. Chat'in kendi adı varsa
    if (chat?.name) return chat.name;
    
    // 2. Direct chat için karşı taraftaki kullanıcı
    if (chat?.type === 'DIRECT' && chat?.members?.length > 0) {
      const otherMember = chat.members[0];
      
      // Güvenli null check'ler
      if (otherMember?.user?.firstName && otherMember?.user?.lastName) {
        return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
      }
      
      // Fallback: username varsa
      if (otherMember?.user?.username) {
        return `@${otherMember.user.username}`;
      }
      
      // Fallback: email varsa
      if (otherMember?.user?.email) {
        return otherMember.user.email;
      }
    }
    
    // 3. Son fallback
    return 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    // Chat'in kendi avatarı varsa
    if (chat?.avatar) return chat.avatar;
    
    // Direct chat için karşı taraftaki kullanıcının avatarı
    if (chat?.type === 'DIRECT' && chat?.members?.length > 0) {
      const otherMember = chat.members[0];
      return otherMember?.user?.avatar || '/default-avatar.png';
    }
    
    // Grup sohbetleri için default
    return '/default-group-avatar.png';
  };

  const getLastMessagePreview = () => {
    // Yazıyor durumu varsa
    if (isTyping && typingUsers?.[chat.id]) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat?.members?.find(m => m?.user?.id === userId);
          return member?.user?.firstName || member?.user?.username || 'Someone';
        })
        .filter(Boolean) // undefined/null değerleri filtrele
        .join(', ');
      
      return typingUsernames ? `${typingUsernames} yazıyor...` : 'Yazıyor...';
    }
    
    // Backend'den gelen son mesaj (string format)
    if (chat?.lastMessage) {
      return chat.lastMessage;
    }
    
    // Backend'den gelen son mesaj object (yeni format)
    if ((chat as any)?.lastMessageObject?.content) {
      return (chat as any).lastMessageObject.content;
    }
    
    return 'Henüz mesaj yok';
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    
    try {
      const messageDate = new Date(date);
      if (isNaN(messageDate.getTime())) return '';
      
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
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const isOnline = chat?.type === 'DIRECT' && chat?.members?.length > 0 
    ? onlineUsers?.has(chat.members[0]?.user?.id)
    : false;

  const unreadCount = (chat as any)?.unreadCount || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative mr-3 flex-shrink-0">
        <img
          src={getChatAvatar()}
          alt={getChatName()}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/default-avatar.png';
          }}
        />
        
        {/* Online indicator for direct chats */}
        {chat?.type === 'DIRECT' && isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        )}
        
        {/* Group chat indicator */}
        {chat?.type === 'GROUP' && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <Users size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Chat info */}
      <div className="flex-1 min-w-0">
        {/* Chat name and status icons */}
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium truncate ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
          }`}>
            {getChatName()}
          </h3>
          
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {chat?.isPinned && (
              <Pin size={14} className="text-blue-500" />
            )}
            {(chat as any)?.isMuted && (
              <VolumeX size={14} className="text-gray-400" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(chat?.lastMessageAt)}
            </span>
          </div>
        </div>

        {/* Last message preview */}
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${
            isTyping 
              ? 'text-blue-500 italic' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {getLastMessagePreview()}
          </p>
          
          {/* Unread count */}
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-2">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;