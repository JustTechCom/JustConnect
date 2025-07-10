// frontend/src/components/Chat/ChatHeader.tsx - Modern Professional Design

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
  Settings,
  Star,
  Share,
  Download,
  X
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

  // Memoized chat data
  const chatData = useMemo(() => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const otherMember = chat.members.find(member => member.user.id !== currentUser?.id);
      
      if (otherMember) {
        return {
          name: `${otherMember.user.firstName} ${otherMember.user.lastName}`,
          avatar: otherMember.user.avatar || '/default-avatar.png',
          isOnline: onlineUsers.has(otherMember.user.id),
          userId: otherMember.user.id,
          username: otherMember.user.username
        };
      }
    }
    
    return {
      name: chat.name || 'Unnamed Chat',
      avatar: chat.avatar || '/default-group-avatar.png',
      isOnline: false,
      userId: null,
      username: null
    };
  }, [chat, currentUser?.id, onlineUsers]);

  const isTyping = useMemo(() => {
    return typingUsers[chat.id]?.length > 0;
  }, [typingUsers, chat.id]);

  const statusText = useMemo(() => {
    if (isTyping) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat.members.find(m => m.user.id === userId);
          return member?.user.firstName || 'Someone';
        })
        .join(', ');
      return `${typingUsernames} typing...`;
    }

    if (chat.type === 'DIRECT') {
      return chatData.isOnline ? 'Online' : 'Last seen recently';
    }

    if (chat.type === 'GROUP') {
      const onlineMembersCount = chat.members.filter(member => 
        onlineUsers.has(member.user.id)
      ).length;
      return `${chat.members.length} members, ${onlineMembersCount} online`;
    }

    return '';
  }, [isTyping, typingUsers, chat, chatData.isOnline, onlineUsers]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleCloseChatInfo = useCallback(() => {
    setShowChatInfo(false);
  }, []);

  return (
    <>
      <div className="glass-card-sm border-x-0 border-t-0 rounded-none backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Chat Info */}
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:bg-white/10 rounded-xl p-2 -m-2 transition-all duration-200 flex-1 min-w-0 group"
              onClick={() => setShowChatInfo(true)}
            >
              {/* Avatar with modern effects */}
              <div className="relative">
                <div className="avatar">
                  <img
                    src={imageError ? '/default-avatar.png' : chatData.avatar}
                    alt={chatData.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  
                  {/* Online Status */}
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

              {/* Chat Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate text-base sm:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {chatData.name}
                  </h2>
                  
                  {/* Verified Badge */}
                  {chat.type === 'DIRECT' && (
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                
                {/* Status with Animations */}
                <div className="flex items-center space-x-2">
                  <p className={`text-xs sm:text-sm truncate transition-colors ${
                    isTyping 
                      ? 'text-indigo-500 dark:text-indigo-400 animate-pulse' 
                      : chatData.isOnline
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {statusText}
                  </p>
                  
                  {/* Typing Dots */}
                  {isTyping && (
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}
                </div>
                
                {/* Username for Direct Chats */}
                {chat.type === 'DIRECT' && chatData.username && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">@{chatData.username}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
              {/* Search */}
              <button className="hidden sm:flex p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group">
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </button>
              
              {/* Call Buttons for Direct Chats */}
              {chat.type === 'DIRECT' && (
                <>
                  <button className="hidden sm:flex p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group relative">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-emerald-500" />
                  </button>
                  
                  <button className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group relative">
                    <Video className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500" />
                  </button>
                </>
              )}
              
              {/* More Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </button>
                
                {/* Modern Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 animate-slide-up z-50">
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setShowChatInfo(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                      >
                        <Info className="w-4 h-4 text-gray-500 group-hover:text-indigo-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat Info</span>
                      </button>
                      
                      <button className="sm:hidden w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                        <Search className="w-4 h-4 text-gray-500 group-hover:text-indigo-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</span>
                      </button>
                      
                      <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                        <Pin className="w-4 h-4 text-gray-500 group-hover:text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pin Chat</span>
                      </button>
                      
                      <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                        <VolumeX className="w-4 h-4 text-gray-500 group-hover:text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mute</span>
                      </button>
                      
                      <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                        <Share className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share</span>
                      </button>
                      
                      <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                        <Archive className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Archive</span>
                      </button>
                      
                      <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-2"></div>
                      
                      <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 group">
                        <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Delete Chat</span>
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

      {/* Modern Chat Info Modal */}
      {showChatInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slide-up">
          <div className="glass-card w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Chat Details
              </h3>
              <button
                onClick={handleCloseChatInfo}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {/* Profile Section */}
              <div className="text-center mb-8">
                <div className="avatar mx-auto mb-4">
                  <img
                    src={imageError ? '/default-avatar.png' : chatData.avatar}
                    alt={chatData.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto"
                    onError={handleImageError}
                  />
                  {chat.type === 'DIRECT' && chatData.isOnline && (
                    <div className="status-indicator status-online"></div>
                  )}
                </div>
                
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {chatData.name}
                </h4>
                
                {chatData.username && (
                  <p className="text-gray-500 dark:text-gray-400 mb-2">@{chatData.username}</p>
                )}
                
                <p className={`text-sm font-medium ${
                  chatData.isOnline 
                    ? 'text-emerald-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {statusText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button className="btn-primary py-3 px-4 text-sm">
                  <Phone className="w-4 h-4 mx-auto mb-1" />
                  Call
                </button>
                <button className="btn-primary py-3 px-4 text-sm">
                  <Video className="w-4 h-4 mx-auto mb-1" />
                  Video
                </button>
                <button className="btn-primary py-3 px-4 text-sm">
                  <Share className="w-4 h-4 mx-auto mb-1" />
                  Share
                </button>
              </div>

              {/* Group Members */}
              {chat.type === 'GROUP' && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Members ({chat.members.length})
                  </h5>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {chat.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="avatar">
                          <img
                            src={member.user.avatar || '/default-avatar.png'}
                            alt={member.user.firstName}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          {onlineUsers.has(member.user.id) && (
                            <div className="status-indicator status-online"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{member.user.username}
                          </p>
                        </div>
                        {member.role === 'ADMIN' && (
                          <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg">
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