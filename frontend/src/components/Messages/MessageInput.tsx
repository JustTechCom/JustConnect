// frontend/src/components/Messages/MessageInput.tsx - Modern Professional Design

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { sendMessage } from '../../store/slices/messageSlice';
import { socketService } from '../../services/socketService';
import { useTyping } from '../../hooks';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  File, 
  X,
  Plus,
  Camera,
  MapPin,
  Gift,
  Hash,
  At
} from 'lucide-react';

interface MessageInputProps {
  chatId: string;
  onScrollToBottom: () => void;
  replyTo?: any;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  chatId, 
  onScrollToBottom, 
  replyTo, 
  onCancelReply,
  disabled = false
}) => {
  const dispatch = useDispatch();
  const { isSending } = useSelector((state: RootState) => state.messages);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startTyping, stopTyping } = useTyping(chatId);

  const emojis = [
    '😀', '😂', '🥰', '😍', '😎', '🤔', '😅', '😊', '👍', '👎', 
    '❤️', '💕', '🔥', '💯', '👏', '🎉', '😢', '😭', '😡', '😱',
    '🤯', '😴', '🤤', '🙄', '🙃', '😏', '😘', '🤗', '🤩', '🥳'
  ];

  const attachmentOptions = [
    { icon: <Image className="w-5 h-5" />, label: 'Photo', type: 'image', color: 'text-blue-500' },
    { icon: <Camera className="w-5 h-5" />, label: 'Camera', type: 'camera', color: 'text-green-500' },
    { icon: <File className="w-5 h-5" />, label: 'File', type: 'file', color: 'text-purple-500' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Location', type: 'location', color: 'text-red-500' },
    { icon: <Gift className="w-5 h-5" />, label: 'Gift', type: 'gift', color: 'text-pink-500' },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return;

    const messageContent = message.trim();
    setMessage('');
    stopTyping();

    try {
      // Send via socket for real-time delivery
      socketService.sendMessage({
        chatId,
        content: messageContent,
        type: 'TEXT',
        replyTo: replyTo?.id
      });

      onScrollToBottom();
      
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      setMessage(messageContent);
      console.error('Failed to send message:', error);
    }
  }, [message, isSending, disabled, chatId, replyTo, onScrollToBottom, onCancelReply, stopTyping]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    
    setShowEmojiPicker(false);
  }, [message]);

  const handleFileSelect = useCallback((type: string) => {
    switch (type) {
      case 'image':
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*';
          fileInputRef.current.click();
        }
        break;
      case 'file':
        if (fileInputRef.current) {
          fileInputRef.current.accept = '*';
          fileInputRef.current.click();
        }
        break;
      case 'camera':
        // Handle camera capture
        break;
      case 'location':
        // Handle location sharing
        break;
      default:
        break;
    }
    setShowAttachments(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Handle file drop
      console.log('Files dropped:', files);
    }
  }, []);

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (disabled) {
    return (
      <div className="glass-card-sm border-t-0 border-x-0 rounded-none backdrop-blur-xl">
        <div className="px-4 py-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            This conversation is no longer available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-sm border-t border-x-0 border-b-0 rounded-none backdrop-blur-xl">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 pt-4">
          <div className="glass-card-sm p-3 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                  Replying to {replyTo.sender.firstName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="ml-2 p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div 
        className={`px-4 py-4 transition-colors ${dragOver ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg border-2 border-dashed border-indigo-400">
            <div className="text-center">
              <File className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                Drop files to share
              </p>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-3">
          {/* Attachment Button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className="p-3 rounded-xl hover:bg-white/20 transition-all duration-200 group"
              disabled={isSending}
            >
              <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:rotate-45 transition-all duration-200" />
            </button>
            
            {/* Attachment Menu */}
            {showAttachments && (
              <div className="absolute bottom-full left-0 mb-2 glass-card p-2 animate-slide-up">
                <div className="grid grid-cols-2 gap-2 w-40">
                  {attachmentOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => handleFileSelect(option.type)}
                      className="flex flex-col items-center p-3 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className={`${option.color} group-hover:scale-110 transition-transform mb-1`}>
                        {option.icon}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <div className="modern-input flex items-end p-0 bg-white/80 dark:bg-gray-800/80">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Recording..." : "Type your message..."}
                disabled={isSending || isRecording}
                className="flex-1 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
              
              {/* Message Actions */}
              <div className="flex items-center space-x-1 px-2 pb-3">
                {/* Emoji Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-yellow-500" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 glass-card p-4 animate-slide-up">
                      <div className="grid grid-cols-6 gap-2 w-64">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mention & Hashtag */}
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <At className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-blue-500" />
                </button>
                
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <Hash className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-green-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Voice/Send Button */}
          <div className="flex space-x-2">
            {/* Voice Recording */}
            {!message.trim() && (
              <button
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onMouseLeave={() => setIsRecording(false)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-500 text-white scale-110' 
                    : 'hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-red-500'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            {/* Send Button */}
            {message.trim() && (
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="btn-primary p-3 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center space-x-2 text-red-500 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Recording... {formatRecordingTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Typing Indicator */}
        {message.length > 0 && (
          <div className="mt-2 flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span className="text-xs">
              {user?.firstName} is typing...
            </span>
          </div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            // Handle file selection
            console.log('Files selected:', files);
          }
        }}
        multiple
      />

      {/* Click outside to close dropdowns */}
      {(showEmojiPicker || showAttachments) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowEmojiPicker(false);
            setShowAttachments(false);
          }}
        />
      )}
    </div>
  );
};

export default MessageInput;