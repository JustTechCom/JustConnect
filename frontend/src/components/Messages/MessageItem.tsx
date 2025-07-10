// frontend/src/components/Messages/MessageItem.tsx - Hooks Kuralları Düzeltilmiş
import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Message, User } from '../../types';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  MoreVertical,
  Reply,
  Heart,
  Copy,
  Edit3,
  Trash2,
  Forward,
  Download,
  Play,
  Pause,
  FileText,
  Image as ImageIcon,
  MapPin,
  Phone,
  Video,
  Smile,
  Eye,
  Zap
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentUser: User;
  previousMessage?: Message;
  nextMessage?: Message;
  isGroupChat?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  previousMessage,
  nextMessage,
  isGroupChat = false,
  onReply,
  onEdit,
  onDelete,
  onReaction
}) => {
  // ✅ HOOKS MUST BE CALLED FIRST - Before any conditional logic
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Animation delay based on message position
  const animationDelay = Math.random() * 200;

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.style.animationDelay = `${animationDelay}ms`;
    }
  }, [animationDelay]);

  // ✅ NOW DO SAFETY CHECKS AFTER HOOKS
  if (!message || !message.id || !currentUser || !currentUser.id) {
    console.warn('MessageItem: Invalid props', { message, currentUser });
    return <div className="text-sm text-gray-500 p-2">Invalid message data</div>;
  }

  // ✅ SAFE PROPERTY ACCESS
  const sender = message.sender || {
    id: 'unknown',
    username: 'unknown',
    firstName: 'Bilinmeyen',
    lastName: 'Kullanıcı',
    avatar: null
  };

  const isOwnMessage = sender.id === currentUser.id;
  const showAvatar = !isOwnMessage && (!nextMessage || nextMessage.sender?.id !== sender.id);
  const showSenderName = isGroupChat && !isOwnMessage && (!previousMessage || previousMessage.sender?.id !== sender.id);
  const isConsecutive = previousMessage?.sender?.id === sender.id;
  const isLastInGroup = !nextMessage || nextMessage.sender?.id !== sender.id;

  const formatMessageTime = (date: Date | string) => {
    try {
      const messageDate = new Date(date);
      const now = new Date();
      const diffInMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);

      if (diffInMinutes < 1) return 'şimdi';
      if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)} dk`;
      if (diffInMinutes < 1440) return format(messageDate, 'HH:mm');
      return format(messageDate, 'dd/MM HH:mm');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Bilinmeyen zaman';
    }
  };

  const getMessageStatus = () => {
    if (!isOwnMessage) return null;

    const iconProps = { className: "w-3 h-3" };
    
    // ✅ Safe status control
    const status = message.read ? 'read' : message.delivered ? 'delivered' : 'sent';
    
    switch (status) {
      case 'sent':
        return <Check {...iconProps} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck {...iconProps} className="text-gray-400" />;
      case 'read':
        return <CheckCheck {...iconProps} className="text-blue-500" />;
      default:
        return <Clock {...iconProps} className="text-gray-400" />;
    }
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowReactions(false);
  };

  const reactions = ['❤️', '😊', '😂', '😮', '😢', '😡', '👍', '👎'];

  const renderMessageContent = () => {
    const messageType = message.type || 'TEXT';
    const content = message.content || '';

    switch (messageType.toUpperCase()) {
      case 'TEXT':
        return (
          <div className="break-words whitespace-pre-wrap">
            {content || 'Mesaj içeriği boş'}
          </div>
        );

      case 'IMAGE':
        const imageUrl = message.file?.url || (message as any).attachments?.[0]?.url;
        if (!imageUrl) {
          return <div className="text-sm text-gray-500">Resim yüklenemedi</div>;
        }
        
        return (
          <div className="relative max-w-sm group">
            <div className={`rounded-2xl overflow-hidden ${!imageLoaded ? 'bg-gray-200 dark:bg-gray-700 animate-pulse h-32' : ''}`}>
              <img
                src={imageUrl}
                alt="Resim"
                className={`max-w-full h-auto transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            {content && (
              <p className="mt-2 text-sm">{content}</p>
            )}
            <button className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Download className="w-4 h-4" />
            </button>
          </div>
        );

      case 'AUDIO':
        const audioUrl = message.file?.url || (message as any).attachments?.[0]?.url;
        const duration = (message as any).attachments?.[0]?.duration || '0:00';
        
        return (
          <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 min-w-[200px]">
            <button
              onClick={handleAudioToggle}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {duration}
              </p>
            </div>
            {audioUrl && (
              <audio 
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={(e) => {
                  const audio = e.target as HTMLAudioElement;
                  if (audio.duration) {
                    setAudioProgress((audio.currentTime / audio.duration) * 100);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
        );

      case 'FILE':
        const file = message.file || (message as any).attachments?.[0];
        const fileName = file?.name || 'Bilinmeyen dosya';
        const fileSize = file?.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Bilinmeyen boyut';
        
        return (
          <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 max-w-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fileSize}</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
          </div>
        );

      case 'LOCATION':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Konum paylaşıldı</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Haritayı görüntülemek için tıklayın</p>
              </div>
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        );

      default:
        return <div className="text-sm">{content || 'Desteklenmeyen mesaj türü'}</div>;
    }
  };

  // ✅ Safe reply message control
  const replyToMessage = message.replyToMessage || (message as any).replyTo;

  return (
    <div
      ref={messageRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
        setShowReactions(false);
      }}
      className={`group relative flex mb-1 transition-all duration-200 ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      } ${isConsecutive ? 'mt-1' : 'mt-4'}`}
    >
      {/* Avatar for other users */}
      {showAvatar && (
        <div className="flex-shrink-0 mr-3">
          <img
            src={sender.avatar || '/default-avatar.png'}
            alt={sender.firstName || 'User'}
            className="w-8 h-8 rounded-full ring-2 ring-white/30 dark:ring-gray-600/30"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.firstName + ' ' + sender.lastName)}&background=3B82F6&color=fff&size=32`;
            }}
          />
        </div>
      )}

      {/* Spacer when avatar is not shown */}
      {!isOwnMessage && !showAvatar && (
        <div className="w-11 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name for group chats */}
        {showSenderName && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-4 font-medium">
            {sender.firstName} {sender.lastName}
          </p>
        )}

        {/* Reply indicator */}
        {replyToMessage && (
          <div className="mb-2 ml-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border-l-2 border-blue-400">
              <p className="font-medium">
                {replyToMessage.sender?.firstName || 'Bilinmeyen kullanıcı'}
              </p>
              <p className="truncate">{replyToMessage.content || 'Mesaj içeriği yok'}</p>
            </div>
          </div>
        )}

        {/* Main message bubble */}
        <div className="relative">
          <div
            className={`relative px-4 py-3 rounded-2xl transition-all duration-300 ${
              isOwnMessage
                ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl ${
                    isLastInGroup ? 'rounded-br-lg' : ''
                  }`
                : `bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md ${
                    isLastInGroup ? 'rounded-bl-lg' : ''
                  }`
            }`}
          >
            {/* Message content */}
            {renderMessageContent()}

            {/* Message time and status */}
            <div className={`flex items-center justify-end mt-2 space-x-1 ${
              isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span className="text-xs">
                {formatMessageTime(message.createdAt)}
              </span>
              {getMessageStatus()}
            </div>

            {/* Edit indicator */}
            {message.edited && (
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                isOwnMessage ? 'bg-white/30' : 'bg-gray-400'
              }`} />
            )}
          </div>

          {/* Message reactions */}
          {(message as any).reactions && Array.isArray((message as any).reactions) && (message as any).reactions.length > 0 && (
            <div className="absolute -bottom-2 left-4 flex space-x-1">
              {(message as any).reactions.map((reaction: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 text-xs shadow-sm cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">{reaction.count || 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message actions */}
      {isHovered && (
        <div className={`absolute top-0 ${isOwnMessage ? 'left-0' : 'right-0'} flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-y-2 z-10`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReactions(!showReactions);
            }}
            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:scale-110 transition-transform"
          >
            <Smile className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply?.(message);
            }}
            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:scale-110 transition-transform"
          >
            <Reply className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:scale-110 transition-transform"
          >
            <MoreVertical className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div 
          className={`absolute ${isOwnMessage ? 'right-12' : 'left-12'} -top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-xl z-20 transform transition-all duration-200 scale-100`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex space-x-1">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions menu */}
      {showActions && (
        <div 
          className={`absolute ${isOwnMessage ? 'right-12' : 'left-12'} top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 overflow-hidden transform transition-all duration-200 scale-100`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(message.content || '');
                setShowActions(false);
              }}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Kopyala</span>
            </button>
            
            <button 
              onClick={() => setShowActions(false)}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
            >
              <Forward className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">İlet</span>
            </button>

            {isOwnMessage && (
              <>
                <button 
                  onClick={() => {
                    onEdit?.(message);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                >
                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Düzenle</span>
                </button>
                
                <button 
                  onClick={() => {
                    onDelete?.(message.id);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-600 dark:text-red-400">Sil</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;