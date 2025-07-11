// frontend/src/components/Chat/ChatHeader.tsx - Chat Header Component
import React from 'react';
import { Chat } from '../../types';
import { 
  Phone, 
  Video, 
  Info, 
  Search,
  MoreVertical,
  Users,
  Crown,
  Shield,
  Star,
  Clock
} from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onToggleInfo?: () => void;
  onToggleSearch?: () => void;
  showInfo?: boolean;
  showSearch?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  onVoiceCall,
  onVideoCall,
  onToggleInfo,
  onToggleSearch,
  showInfo = false,
  showSearch = false,
}) => {
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

  const getStatusText = () => {
    if (chat.type === 'DIRECT' && chat.members.length > 0) {
      const member = chat.members[0].user;
      if (member.isOnline) return 'Online';
      
      const lastSeen = new Date(member.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return lastSeen.toLocaleDateString();
    }
    
    if (chat.type === 'GROUP') {
      const onlineCount = chat.members.filter(m => m.user.isOnline).length;
      return `${chat.members.length} members, ${onlineCount} online`;
    }
    
    if (chat.type === 'CHANNEL') {
      return `${chat.members.length} subscribers`;
    }
    
    return '';
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Chat Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="relative">
            <img
              src={getChatAvatar()}
              alt={getChatName()}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50 shadow-lg"
            />
            
            {/* Online indicator for direct chats */}
            {chat.type === 'DIRECT' && (
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                getOnlineStatus() ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            )}
            
            {/* Group indicator */}
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
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {getChatName()}
              </h1>
              
              {/* Badges */}
              <div className="flex items-center space-x-1">
                {chat.isVerified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {chat.isPinned && (
                  <Star className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center space-x-2">
              {getOnlineStatus() && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {getStatusText()}
              </p>
              
              {/* Typing indicator */}
              {chat.isTyping && (
                <div className="flex items-center space-x-1 text-blue-500">
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-100" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
                  </div>
                  <span className="text-xs">typing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Voice/Video Call Buttons (only for direct chats) */}
          {chat.type === 'DIRECT' && (
            <>
              <button 
                onClick={onVoiceCall}
                className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 text-green-600"
                title="Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onVideoCall}
                className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 text-blue-600"
                title="Video Call"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Search Messages */}
          <button 
            onClick={onToggleSearch}
            className={`p-2.5 rounded-xl border border-white/20 dark:border-gray-600/20 transition-all duration-300 hover:scale-105 ${
              showSearch 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-600 dark:text-gray-300'
            }`}
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Chat Info */}
          <button 
            onClick={onToggleInfo}
            className={`p-2.5 rounded-xl border border-white/20 dark:border-gray-600/20 transition-all duration-300 hover:scale-105 ${
              showInfo 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-600 dark:text-gray-300'
            }`}
            title="Chat Info"
          >
            <Info className="w-5 h-5" />
          </button>
          
          {/* More Options */}
          <div className="relative group">
            <button className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 text-gray-600 dark:text-gray-300">
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Chat Options
                </p>
              </div>
              
              <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                <Star className="w-4 h-4" />
                <span>Pin Chat</span>
              </button>
              
              <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                <Clock className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;