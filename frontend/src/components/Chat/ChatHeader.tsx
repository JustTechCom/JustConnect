// frontend/src/components/Chat/ChatHeader.tsx - Düzeltilmiş versiyon

import React, { useState } from 'react';
import { Chat } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Users, 
  Info,
  Volume2,
  VolumeX,
  Pin,
  Archive,
  Trash2,
  Settings
} from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { onlineUsers, typingUsers } = useSelector((state: RootState) => state.chats);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);

  const isTyping = typingUsers?.[chat?.id]?.length > 0;

  const getChatName = () => {
    if (chat?.name) return chat.name;
    
    if (chat?.type === 'DIRECT' && chat?.members?.length > 0) {
      const otherMember = chat.members[0];
      
      if (otherMember?.user?.firstName && otherMember?.user?.lastName) {
        return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
      }
      
      if (otherMember?.user?.username) {
        return `@${otherMember.user.username}`;
      }
      
      if (otherMember?.user?.email) {
        return otherMember.user.email;
      }
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    if (chat?.avatar) return chat.avatar;
    
    if (chat?.type === 'DIRECT' && chat?.members?.length > 0) {
      const otherMember = chat.members[0];
      return otherMember?.user?.avatar || '/default-avatar.png';
    }
    
    return '/default-group-avatar.png';
  };

  const getStatusText = () => {
    if (isTyping && typingUsers?.[chat?.id]) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat?.members?.find(m => m?.user?.id === userId);
          return member?.user?.firstName || member?.user?.username || 'Someone';
        })
        .filter(Boolean)
        .join(', ');
      
      return typingUsernames ? `${typingUsernames} yazıyor...` : 'Yazıyor...';
    }

    if (chat?.type === 'DIRECT' && chat?.members?.length > 0) {
      const otherMember = chat.members[0];
      const userId = otherMember?.user?.id;
      
      if (userId && onlineUsers?.has(userId)) {
        return 'Çevrimiçi';
      } else {
        // Son görülme zamanı varsa göster
        if (otherMember?.user?.lastSeen) {
          const lastSeen = new Date(otherMember.user.lastSeen);
          const now = new Date();
          const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
          
          if (diffInMinutes < 60) {
            return `${Math.floor(diffInMinutes)} dakika önce görüldü`;
          } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} saat önce görüldü`;
          } else {
            return lastSeen.toLocaleDateString('tr-TR');
          }
        }
        return 'Çevrimdışı';
      }
    }

    if (chat?.type === 'GROUP') {
      const totalMembers = chat?.members?.length || 0;
      const onlineMembersCount = chat?.members?.filter(member => 
        member?.user?.id && onlineUsers?.has(member.user.id)
      ).length || 0;
      
      return `${totalMembers} üye, ${onlineMembersCount} çevrimiçi`;
    }

    return '';
  };

  const isOnline = chat?.type === 'DIRECT' && chat?.members?.length > 0 
    ? onlineUsers?.has(chat.members[0]?.user?.id)
    : false;

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Chat Info */}
        <div 
          className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
          onClick={() => setShowChatInfo(true)}
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={getChatAvatar()}
              alt={getChatName()}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
            {/* Online indicator */}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">
              {getChatName()}
            </h2>
            <p className={`text-sm truncate ${
              isTyping 
                ? 'text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Search size={20} />
          </button>

          {/* Voice Call */}
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Phone size={20} />
          </button>

          {/* Video Call */}
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Video size={20} />
          </button>

          {/* More Options */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Info size={16} />
                  <span>Sohbet Bilgileri</span>
                </button>
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Pin size={16} />
                  <span>Sabitle</span>
                </button>
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <VolumeX size={16} />
                  <span>Sessiz</span>
                </button>
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Archive size={16} />
                  <span>Arşivle</span>
                </button>
                <button className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Trash2 size={16} />
                  <span>Sil</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Info Modal - Basit implementasyon */}
      {showChatInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sohbet Bilgileri
              </h3>
              <button
                onClick={() => setShowChatInfo(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-4">
              <img
                src={getChatAvatar()}
                alt={getChatName()}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
              <h4 className="font-medium text-gray-900 dark:text-white">
                {getChatName()}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getStatusText()}
              </p>
            </div>

            {chat?.type === 'GROUP' && (
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  Üyeler ({chat?.members?.length || 0})
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {chat?.members?.map((member) => (
                    <div key={member?.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={member?.user?.avatar || '/default-avatar.png'}
                          alt={member?.user?.firstName || 'Unknown'}
                          className="w-8 h-8 rounded-full"
                        />
                        {member?.user?.id && onlineUsers?.has(member.user.id) && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member?.user?.firstName && member?.user?.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member?.user?.username || 'Unknown User'
                          }
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{member?.user?.username || 'unknown'}
                        </p>
                      </div>
                      {member?.role === 'ADMIN' && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;