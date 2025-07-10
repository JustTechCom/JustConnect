// frontend/src/components/Sidebar/ChatItem.tsx - Enhanced Modern Design
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Chat } from '../../types';
import { 
  MessageCircle, 
  Users, 
  Pin, 
  VolumeX, 
  Check, 
  CheckCheck,
  Clock,
  Image,
  File,
  Mic,
  Video,
  MapPin,
  Heart,
  Smile
} from 'lucide-react';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Simulate typing indicator
  useEffect(() => {
    const typingInterval = Math.random() * 10000 + 5000; // Random between 5-15 seconds
    const timer = setTimeout(() => {
      if (!isActive && Math.random() > 0.8) { // 20% chance
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, typingInterval);

    return () => clearTimeout(timer);
  }, [isActive]);

  const getOtherUser = () => {
    return chat.members.find(member => member.user.id !== chat.currentUserId)?.user;
  };

  const otherUser = getOtherUser();
  const unreadCount = chat.unreadCount || 0;
  const isGroupChat = chat.type === 'group';
  const isPinned = chat.isPinned;
  const isMuted = chat.isMuted;

  const getChatDisplayInfo = () => {
    if (isGroupChat) {
      return {
        name: chat.name || 'Grup Sohbeti',
        avatar: chat.avatar || '/default-group-avatar.png',
        isOnline: false,
        memberCount: chat.members.length
      };
    } else {
      return {
        name: `${otherUser?.firstName} ${otherUser?.lastName}`,
        avatar: otherUser?.avatar || '/default-avatar.png',
        isOnline: otherUser?.isOnline || false,
        username: otherUser?.username
      };
    }
  };

  const { name, avatar, isOnline, memberCount, username } = getChatDisplayInfo();
const getChatName = () => {
  if (chat.name) return chat.name;
  
  if (chat.type === 'DIRECT' && chat.members?.length > 0) {
    const otherMember = chat.members[0];
    // Güvenli null check
    if (otherMember?.user?.firstName && otherMember?.user?.lastName) {
      return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
    }
    // Fallback: username varsa onu kullan
    if (otherMember?.user?.username) {
      return `@${otherMember.user.username}`;
    }
  }
  
  return 'Unnamed Chat';
};

const getChatAvatar = () => {
  if (chat.avatar) return chat.avatar;
  
  if (chat.type === 'DIRECT' && chat.members?.length > 0) {
    const otherMember = chat.members[0];
    return otherMember?.user?.avatar || '/default-avatar.png';
  }
  
  return '/default-group-avatar.png';
};

const getLastMessagePreview = () => {
  if (isTyping) {
    const typingUsernames = typingUsers[chat.id]
      ?.map(userId => {
        const member = chat.members?.find(m => m?.user?.id === userId);
        return member?.user?.firstName || 'Someone';
      })
      .join(', ');
    return `${typingUsernames} yazıyor...`;
  }
  
  return chat.lastMessage || 'Henüz mesaj yok';
};

// Component'in geri kalanında da benzer güvenli kontroller ekleyin
const isOnline = chat.type === 'DIRECT' && chat.members?.length > 0 
  ? onlineUsers.has(chat.members[0]?.user?.id)
  : false;
  const getLastMessagePreview = () => {
    if (isTyping) {
      return 'yazıyor...';
    }

    if (!chat.lastMessage) {
      return isGroupChat ? 'Grup oluşturuldu' : 'Sohbet başlatıldı';
    }

    const { content, type, sender } = chat.lastMessage;
    const senderName = sender.firstName;
    const isOwnMessage = sender.id === chat.currentUserId;
    const senderPrefix = isGroupChat && !isOwnMessage ? `${senderName}: ` : '';

    switch (type) {
      case 'image':
        return `${senderPrefix}📷 Fotoğraf`;
      case 'file':
        return `${senderPrefix}📎 Dosya`;
      case 'audio':
        return `${senderPrefix}🎤 Ses mesajı`;
      case 'video':
        return `${senderPrefix}🎥 Video`;
      case 'location':
        return `${senderPrefix}📍 Konum`;
      default:
        return `${senderPrefix}${content}`;
    }
  };

  const getMessageIcon = () => {
    if (!chat.lastMessage) return null;
    
    const { type } = chat.lastMessage;
    const iconProps = { className: "w-3 h-3 mr-1 flex-shrink-0" };
    
    switch (type) {
      case 'image':
        return <Image {...iconProps} />;
      case 'file':
        return <File {...iconProps} />;
      case 'audio':
        return <Mic {...iconProps} />;
      case 'video':
        return <Video {...iconProps} />;
      case 'location':
        return <MapPin {...iconProps} />;
      default:
        return null;
    }
  };

  const getMessageStatus = () => {
    if (!chat.lastMessage || chat.lastMessage.sender.id !== chat.currentUserId) {
      return null;
    }

    const { status } = chat.lastMessage;
    const iconProps = { className: "w-3 h-3 ml-1 flex-shrink-0" };

    switch (status) {
      case 'sent':
        return <Check {...iconProps} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck {...iconProps} className="text-gray-400" />;
      case 'read':
        return <CheckCheck {...iconProps} className="text-blue-500" />;
      case 'pending':
        return <Clock {...iconProps} className="text-gray-300" />;
      default:
        return null;
    }
  };

  const formatLastMessageTime = () => {
    if (!chat.lastMessage) return '';
    
    const messageDate = new Date(chat.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return formatDistanceToNow(messageDate, { 
        addSuffix: false, 
        locale: tr 
      });
    } else {
      return messageDate.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getReactionEmoji = () => {
    // Simulate some chats having reactions
    if (Math.random() > 0.8 && chat.lastMessage) {
      const reactions = ['❤️', '👍', '😊', '😂', '😮', '😢'];
      return reactions[Math.floor(Math.random() * reactions.length)];
    }
    return null;
  };

  const reaction = getReactionEmoji();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative p-4 mx-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
        isActive
          ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-soft scale-[1.02] border-l-4 border-primary-500'
          : 'hover:bg-white/40 dark:hover:bg-gray-800/40 hover:shadow-soft hover:scale-[1.01]'
      }`}
    >
      {/* Animated background effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isActive 
          ? 'bg-gradient-to-r from-primary-500/5 to-primary-600/5' 
          : 'bg-gradient-to-r from-blue-500/5 to-purple-500/5'
      }`} />
      
      {/* Shimmer effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
        'bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000'
      }`} />

      <div className="relative z-10 flex items-center space-x-3">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          {/* Glow effect for active chat */}
          {isActive && (
            <div className="absolute inset-0 bg-primary-400/20 rounded-full animate-pulse-slow" />
          )}
          
          {/* Main avatar */}
          <div className={`relative transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}>
            <img
              src={avatar}
              alt={name}
              className={`w-14 h-14 rounded-full object-cover transition-all duration-300 ${
                isActive 
                  ? 'ring-3 ring-primary-400/50 shadow-glow-primary' 
                  : 'ring-2 ring-white/30 dark:ring-gray-600/30 group-hover:ring-primary-300/50'
              }`}
            />
            
            {/* Online status indicator */}
            {!isGroupChat && isOnline && (
              <div className="absolute -bottom-1 -right-1">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-soft">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
                </div>
              </div>
            )}
            
            {/* Group indicator */}
            {isGroupChat && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            
            {/* Typing indicator around avatar */}
            {isTyping && (
              <div className="absolute inset-0 rounded-full border-2 border-primary-400 animate-ping" />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            {/* Name and indicators */}
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className={`font-semibold truncate transition-colors duration-200 ${
                isActive 
                  ? 'text-primary-700 dark:text-primary-300' 
                  : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
              }`}>
                {name}
              </h3>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-1">
                {isPinned && (
                  <Pin className="w-3 h-3 text-yellow-500 animate-bounce-subtle" />
                )}
                {isMuted && (
                  <VolumeX className="w-3 h-3 text-gray-400" />
                )}
                {isGroupChat && memberCount && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {memberCount}
                  </span>
                )}
              </div>
            </div>

            {/* Time and unread count */}
            <div className="flex items-center space-x-2 ml-2">
              <span className={`text-xs whitespace-nowrap transition-colors duration-200 ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatLastMessageTime()}
              </span>
              
              {unreadCount > 0 && (
                <div className={`min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center text-xs font-bold text-white animate-scale-in ${
                  isMuted 
                    ? 'bg-gray-400' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 shadow-glow-error'
                }`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
          </div>

          {/* Last message preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              {/* Message type icon */}
              {getMessageIcon()}
              
              <p className={`text-sm truncate transition-colors duration-200 ${
                isTyping 
                  ? 'text-primary-500 dark:text-primary-400 italic animate-pulse' 
                  : isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : unreadCount > 0
                      ? 'text-gray-800 dark:text-gray-200 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
              }`}>
                {getLastMessagePreview()}
              </p>

              {/* Message status */}
              {getMessageStatus()}
            </div>

            {/* Reaction emoji */}
            {reaction && !isTyping && (
              <div className="ml-2 text-sm animate-bounce-subtle">
                {reaction}
              </div>
            )}
          </div>

          {/* Subtitle for group chats or username */}
          {(isGroupChat || username) && !isTyping && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {isGroupChat 
                ? `${memberCount} üye • Son mesaj: ${formatLastMessageTime()}`
                : `@${username}`
              }
            </p>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && !isActive && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex space-x-1">
            <button className="p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-soft">
              <Pin className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-soft">
              <VolumeX className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
      )}
    </div>
  );
};

export default ChatItem;