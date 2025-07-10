// frontend/src/components/Chat/ChatHeader.tsx - Avatar pırpırlama ve mobil düzeltmesi

import React, { useState, useMemo, useCallback } from 'react';
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

const ChatHeader: React.FC<ChatHeaderProps> = React.memo(({ chat }) => {
  const { onlineUsers, typingUsers } = useSelector((state: RootState) => state.chats);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoized chat data to prevent re-renders
  const chatData = useMemo(() => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      // Direct chat - get other user (not current user)
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

  // Memoized typing state
  const isTyping = useMemo(() => {
    return typingUsers[chat.id]?.length > 0;
  }, [typingUsers, chat.id]);

  // Memoized status text
  const statusText = useMemo(() => {
    if (isTyping) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat.members.find(m => m.user.id === userId);
          return member?.user.firstName || 'Someone';
        })
        .join(', ');
      return `${typingUsernames} yazıyor...`;
    }

    if (chat.type === 'DIRECT') {
      return chatData.isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    }

    if (chat.type === 'GROUP') {
      const onlineMembersCount = chat.members.filter(member => 
        onlineUsers.has(member.user.id)
      ).length;
      return `${chat.members.length} üye, ${onlineMembersCount} çevrimiçi`;
    }

    return '';
  }, [isTyping, typingUsers, chat, chatData.isOnline, onlineUsers]);

  // Image error handler
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Close menu handler
  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  // Close chat info handler
  const handleCloseChatInfo = useCallback(() => {
    setShowChatInfo(false);
  }, []);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Chat Info - Mobil responsive */}
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1 sm:p-2 -m-1 sm:-m-2 transition-colors flex-1 min-w-0"
              onClick={() => setShowChatInfo(true)}
            >
              <div className="relative flex-shrink-0">
                {/* DÜZELTME: Stable image with error handling */}
                <img
                  src={imageError ? '/default-avatar.png' : chatData.avatar}
                  alt={chatData.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover transition-none"
                  onError={handleImageError}
                  loading="lazy"
                  style={{
                    // Prevent layout shifts
                    minWidth: '32px',
                    minHeight: '32px',
                    backgroundColor: '#f3f4f6'
                  }}
                />
                
                {/* Online indicator for direct chats */}
                {chat.type === 'DIRECT' && chatData.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full ring-1 sm:ring-2 ring-white dark:ring-gray-800 transition-none"></div>
                )}
                
                {/* Group indicator */}
                {chat.type === 'GROUP' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* DÜZELTME: Responsive text */}
                <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                  {chatData.name}
                </h2>
                
                <p className={`text-xs sm:text-sm truncate transition-colors ${
                  isTyping 
                    ? 'text-blue-500 dark:text-blue-400 italic' 
                    : chatData.isOnline
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {statusText}
                </p>
              </div>
            </div>

            {/* Action Buttons - Mobil responsive */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
              {/* Search - Hidden on mobile */}
              <button className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              {/* Call buttons - Hidden on mobile for direct chats */}
              {chat.type === 'DIRECT' && (
                <>
                  <button className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  
                  <button className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* More menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Menu dropdown */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setShowChatInfo(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Info className="w-4 h-4" />
                        <span>Sohbet Bilgileri</span>
                      </button>
                      
                      {/* Mobile-only search */}
                      <button className="sm:hidden w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Ara</span>
                      </button>
                      
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                        <Pin className="w-4 h-4" />
                        <span>Sabitle</span>
                      </button>
                      
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                        <VolumeX className="w-4 h-4" />
                        <span>Sessiz</span>
                      </button>
                      
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                        <Archive className="w-4 h-4" />
                        <span>Arşivle</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Sohbeti Sil</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseMenu}
        />
      )}

      {/* Chat Info Modal - Mobil responsive */}
      {showChatInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sohbet Bilgileri
              </h3>
              <button
                onClick={handleCloseChatInfo}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="p-4">
              <div className="text-center mb-6">
                <img
                  src={imageError ? '/default-avatar.png' : chatData.avatar}
                  alt={chatData.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  onError={handleImageError}
                />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {chatData.name}
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  {statusText}
                </p>
              </div>

              {chat.type === 'GROUP' && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Üyeler ({chat.members.length})
                  </h5>
                  <div className="space-y-2">
                    {chat.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={member.user.avatar || '/default-avatar.png'}
                            alt={member.user.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          {onlineUsers.has(member.user.id) && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{member.user.username}
                          </p>
                        </div>
                        {member.role === 'ADMIN' && (
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
        </div>
      )}
    </>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;