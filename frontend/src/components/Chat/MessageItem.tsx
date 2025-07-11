// frontend/src/components/Chat/MessageItem.tsx - Individual Message Component
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message } from '../../types';
import { setReplyToMessage, setEditingMessage } from '../../store/slices/messageSlice';
import { 
  Reply, 
  Edit, 
  Trash2, 
  Copy, 
  Forward, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Download,
  Play,
  Image as ImageIcon,
  File,
  MapPin,
  Smile,
  Heart,
  ThumbsUp,
  Angry,
  Sad,
  Laugh
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTime: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isOwn, 
  showAvatar, 
  showTime 
}) => {
  const dispatch = useDispatch();
  const { reactions } = useSelector((state: RootState) => state.messages);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const messageReactions = reactions[message.id] || {};
  const hasReactions = Object.keys(messageReactions).length > 0;

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleReply = () => {
    dispatch(setReplyToMessage(message));
    setShowMenu(false);
  };

  const handleEdit = () => {
    dispatch(setEditingMessage(message));
    setShowMenu(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      // Handle delete
    }
    setShowMenu(false);
  };

  const handleReaction = (emoji: string) => {
    // Handle reaction logic
    setShowReactions(false);
  };

  const getMessageStatusIcon = () => {
    if (!isOwn) return null;
    
    if (message.read) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (message.delivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="relative group">
            <img
              src={message.content}
              alt="Shared image"
              className="max-w-sm rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // Open image in modal
              }}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <Download className="w-8 h-8 text-white" />
            </div>
          </div>
        );
        
      case 'FILE':
        return (
          <div className="flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl max-w-sm">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <File className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {message.content || 'Unknown file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDF • 2.4 MB
              </p>
            </div>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        );
        
      case 'AUDIO':
        return (
          <div className="flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl max-w-sm">
            <button className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
              <Play className="w-6 h-6 text-white ml-1" />
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full">
                <div className="h-2 bg-green-500 rounded-full w-1/3" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                1:23 / 3:45
              </p>
            </div>
          </div>
        );
        
      case 'VIDEO':
        return (
          <div className="relative group max-w-sm">
            <video
              className="w-full rounded-xl shadow-lg"
              poster={message.content}
              controls
            >
              <source src={message.content} type="video/mp4" />
            </video>
          </div>
        );
        
      case 'LOCATION':
        return (
          <div className="flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl max-w-sm">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Shared Location
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tap to view on map
              </p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap break-words m-0">
              {message.content}
            </p>
          </div>
        );
    }
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`group flex items-start space-x-3 px-4 py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${
      isOwn ? 'flex-row-reverse space-x-reverse' : ''
    }`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          <img
            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.firstName}+${message.sender.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
            alt={message.sender.firstName}
            className="w-8 h-8 rounded-lg object-cover"
          />
        </div>
      )}
      
      {/* Spacer for alignment when no avatar */}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={`flex-1 max-w-2xl ${isOwn ? 'flex flex-col items-end' : ''}`}>
        {/* Sender name (for group chats) */}
        {!isOwn && showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {message.sender.firstName} {message.sender.lastName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Reply reference */}
        {message.replyTo && message.replyToMessage && (
          <div className={`mb-2 ${isOwn ? 'self-end' : ''}`}>
            <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500 max-w-md">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {message.replyToMessage.sender.firstName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {message.replyToMessage.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
          } ${message.type !== 'TEXT' ? 'p-2' : ''}`}>
            {renderMessageContent()}
            
            {/* Edited indicator */}
            {message.edited && (
              <span className={`text-xs opacity-70 ml-2 ${
                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                (edited)
              </span>
            )}
          </div>

          {/* Quick reaction button */}
          <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="w-6 h-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
            >
              <Smile className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Quick reactions */}
            {showReactions && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex space-x-1 z-10">
                {quickReactions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message menu */}
          <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ${
            isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
          }`}>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg flex items-center justify-center transition-colors mx-2"
              >
                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              
              {showMenu && (
                <div className={`absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 ${
                  isOwn ? 'right-0' : 'left-0'
                }`}>
                  <button
                    onClick={handleReply}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                  
                  <button
                    onClick={handleCopy}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                    <Forward className="w-4 h-4" />
                    <span>Forward</span>
                  </button>
                  
                  {isOwn && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className={`flex flex-wrap gap-1 mt-2 ${isOwn ? 'justify-end' : ''}`}>
            {Object.entries(messageReactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  userIds.includes(user?.id || '')
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleReaction(emoji)}
              >
                <span>{emoji}</span>
                <span>{userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time and status */}
        {showTime && (
          <div className={`flex items-center space-x-2 mt-1 ${
            isOwn ? 'justify-end' : ''
          }`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {getMessageStatusIcon()}
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showMenu || showReactions) && (
        <div
          className="fixed inset-0 z-10"
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