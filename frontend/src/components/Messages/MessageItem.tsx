// frontend/src/components/Messages/MessageItem.tsx - Modern Professional Design

import React, { useState, useCallback, useMemo } from 'react';
import { Message, Chat } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Trash2, 
  Copy, 
  Forward, 
  Star,
  Check,
  CheckCheck,
  Clock,
  Image,
  File,
  Download,
  Play,
  Pause,
  MapPin,
  Heart,
  ThumbsUp,
  Smile,
  Eye
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  chat: Chat;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar,
  chat,
  onReply,
  onEdit,
  onDelete
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const reactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  // Format message time
  const formatTime = useCallback((date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Get message status icon
  const getStatusIcon = useMemo(() => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  }, [isOwn, message.status]);

  // Handle message actions
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  }, [message.content]);

  const handleReaction = useCallback((emoji: string) => {
    // Handle reaction logic
    console.log('Reaction:', emoji, message.id);
    setShowReactions(false);
  }, [message.id]);

  // Render different message types
  const renderMessageContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="relative group">
            <img
              src={message.file?.url || message.content}
              alt="Shared image"
              className={`max-w-xs rounded-xl object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        );

      case 'FILE':
        return (
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl max-w-xs">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {message.file?.filename || 'Unknown file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message.file?.size ? `${(message.file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        );

      case 'AUDIO':
        return (
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl max-w-xs">
            <button 
              onClick={() => setAudioPlaying(!audioPlaying)}
              className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {audioPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message.file?.duration || '0:00'}
              </p>
            </div>
          </div>
        );

      case 'LOCATION':
        return (
          <div className="relative rounded-xl overflow-hidden max-w-xs">
            <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-3">
              <p className="font-medium text-sm">Shared Location</p>
              <p className="text-xs opacity-75">Tap to view in maps</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {/* Reply Preview */}
            {message.replyToMessage && (
              <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-r-lg">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {message.replyToMessage.sender.firstName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {message.replyToMessage.content}
                </p>
              </div>
            )}
            
            {/* Message Text */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`flex items-end space-x-2 group mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
          <img
            src={message.sender.avatar || '/default-avatar.png'}
            alt={message.sender.firstName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Spacer for alignment */}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
        {/* Sender Name (for groups, non-own messages) */}
        {!isOwn && chat.type === 'GROUP' && showAvatar && (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-1">
            {message.sender.firstName}
          </p>
        )}

        {/* Message Bubble */}
        <div className="relative">
          <div className={`message-bubble ${isOwn ? 'message-sent' : 'message-received'} group-hover:scale-[1.02] transition-transform duration-200`}>
            {renderMessageContent()}
            
            {/* Message Info */}
            <div className={`flex items-center justify-end space-x-1 mt-2 ${
              isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span className="text-xs">
                {formatTime(message.createdAt)}
              </span>
              {getStatusIcon}
              {message.edited && (
                <span className="text-xs opacity-70">edited</span>
              )}
            </div>
          </div>

          {/* Message Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-2 left-2 flex space-x-1">
              {Object.entries(
                message.reactions.reduce((acc: any, r: any) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 text-xs hover:scale-110 transition-transform shadow-sm"
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          {/* Hover Actions */}
          {isHovered && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 animate-slide-left`}>
              {/* Quick Reactions */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:scale-110 transition-all shadow-sm"
                >
                  <Smile className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                
                {showReactions && (
                  <div className="absolute bottom-full mb-2 flex space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 shadow-lg animate-slide-up">
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-1 hover:scale-125 transition-transform text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Button */}
              <button
                onClick={() => onReply?.(message)}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:scale-110 transition-all shadow-sm"
              >
                <Reply className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* More Actions */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:scale-110 transition-all shadow-sm"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                {showMenu && (
                  <div className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} w-40 glass-card p-2 animate-slide-up z-50`}>
                    <button
                      onClick={handleCopy}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </button>
                    
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2">
                      <Forward className="w-4 h-4" />
                      <span className="text-sm">Forward</span>
                    </button>
                    
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Star</span>
                    </button>
                    
                    {isOwn && (
                      <>
                        <button
                          onClick={() => onEdit?.(message)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">Edit</span>
                        </button>
                        
                        <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-1"></div>
                        
                        <button
                          onClick={() => onDelete?.(message.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 group"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showMenu || showReactions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowMenu(false);
            setShowReactions(false);
          }}
        />
      )}
    </div>
  );
};

export default MessageItem;