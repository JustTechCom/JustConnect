// frontend/src/components/Sidebar/ChatItem.tsx - Modern Chat Item
import React, { useState } from 'react';
import { Chat } from '../../types';
import { 
  MoreVertical, 
  Pin, 
  Archive, 
  Trash2, 
  Volume2, 
  VolumeX,
  Users,
  Crown,
  Shield,
  CheckCheck,
  Check,
  Clock,
  Camera,
  File,
  Mic,
  Image,
  MapPin
} from 'lucide-react';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getChatName = () => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const otherMember = chat.members[0];
      return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
    }
    return chat.name || 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    if (chat.avatar) return chat.avatar;
    
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const otherMember = chat.members[0];
      return otherMember.user.avatar || 
        `https://ui-avatars.com/api/?name=${otherMember.user.firstName}+${otherMember.user.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`;
    }
    
    return `https://ui-avatars.com/api/?name=${chat.name || 'Chat'}&background=6366f1&color=ffffff&rounded=true&bold=true`;
  };

  const getOnlineStatus = () => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      return chat.members[0].user.isOnline;
    }
    return false;
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const message = chat.lastMessage;
    
    // Handle different message types
    if (typeof message === 'string') {
      return message.length > 50 ? `${message.substring(0, 50)}...` : message;
    }
    
    if (typeof message === 'object' && message.type) {
      switch (message.type) {
        case 'IMAGE':
          return '📷 Photo';
        case 'FILE':
          return '📎 File';
        case 'AUDIO':
          return '🎵 Audio';
        case 'VIDEO':
          return '🎥 Video';
        case 'LOCATION':
          return '📍 Location';
        default:
          return message.content || 'Message';
      }
    }
    
    return 'Message';
  };

  const getMessageIcon = () => {
    if (!chat.lastMessage || typeof chat.lastMessage === 'string') return null;
    
    switch (chat.lastMessage.type) {
      case 'IMAGE':
        return <Image className="w-3 h-3 text-green-500" />;
      case 'FILE':
        return <File className="w-3 h-3 text-blue-500" />;
      case 'AUDIO':
        return <Mic className="w-3 h-3 text-purple-500" />;
      case 'VIDEO':
        return <Camera className="w-3 h-3 text-red-500" />;
      case 'LOCATION':
        return <MapPin className="w-3 h-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const isUnread = (chat.unreadCount || 0) > 0;
  const isPinned = chat.isPinned || false;
  const isMuted = chat.isMuted || false;

  return (
    <div
      className={`group relative p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
        isActive
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg scale-[1.02]'
          : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-white/20 dark:border-gray-700/20 hover:shadow-md hover:scale-[1.01]'
      }`}
      onClick={onClick}
    >
      {/* Pin Indicator */}
      {isPinned && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
      )}

      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={getChatAvatar()}
            alt={getChatName()}
            className={`w-12 h-12 rounded-xl object-cover border-2 transition-all duration-300 ${
              isActive 
                ? 'border-blue-400 shadow-lg' 
                : 'border-white/50 dark:border-gray-700/50'
            }`}
          />
          
          {/* Online status for direct chats */}
          {chat.type === 'DIRECT' && (
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              getOnlineStatus() ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          )}
          
          {/* Group chat indicator */}
          {chat.type === 'GROUP' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <Users className="w-2 h-2 text-white" />
            </div>
          )}
          
          {/* Channel indicator */}
          {chat.type === 'CHANNEL' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <Crown className="w-2 h-2 text-white" />
            </div>
          )}
          
          {/* Verified badge */}
          {chat.isVerified && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <Shield className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Chat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${
              isActive 
                ? 'text-blue-700 dark:text-blue-300' 
                : isUnread 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300'
            }`}>
              {getChatName()}
              {chat.isVerified && (
                <Shield className="inline w-3 h-3 ml-1 text-blue-500" />
              )}
            </h3>
            
            <div className="flex items-center space-x-1">
              {chat.lastMessageAt && (
                <span className={`text-xs ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : isUnread 
                      ? 'text-gray-600 dark:text-gray-300' 
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {formatTime(chat.lastMessageAt)}
                </span>
              )}
              
              {isPinned && (
                <Pin className="w-3 h-3 text-yellow-500" />
              )}
              
              {isMuted && (
                <VolumeX className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              {getMessageIcon()}
              <p className={`text-sm truncate ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : isUnread 
                    ? 'text-gray-700 dark:text-gray-300 font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {getLastMessagePreview()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {/* Message status (for own messages) */}
              {chat.lastMessage && typeof chat.lastMessage === 'object' && chat.lastMessage.isOwn && (
                <div className="text-gray-400">
                  {chat.lastMessage.read ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : chat.lastMessage.delivered ? (
                    <CheckCheck className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </div>
              )}
              
              {/* Unread count */}
              {isUnread && (
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                  isMuted ? 'bg-gray-400' : 'bg-blue-500'
                } ${isUnread && !isMuted ? 'animate-pulse' : ''}`}>
                  {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
                </div>
              )}
              
              {/* Typing indicator */}
              {chat.isTyping && (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-100" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              showMenu || isActive
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-gray-700/20 py-2 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle pin/unpin
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Pin className="w-4 h-4" />
                <span>{isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle mute/unmute
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle archive
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Chat</span>
              </button>
              
              <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                  if (window.confirm('Are you sure you want to delete this chat?')) {
                    // Delete logic here
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ChatItem;