// frontend/src/components/Chat/MessageInput.tsx - Message Input Component
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { sendMessage, updateDraft } from '../../store/slices/messageSlice';
import { useTyping } from '../../hooks/useTyping';
import socketService from '../../services/socketService';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon, 
  Camera, 
  Mic, 
  MapPin,
  X,
  File,
  Video,
  Plus,
  Zap
} from 'lucide-react';

interface MessageInputProps {
  chatId: string;
  onScrollToBottom: () => void;
  replyTo?: any;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  chatId, 
  onScrollToBottom, 
  replyTo, 
  onCancelReply 
}) => {
  const dispatch = useDispatch();
  const { isSending, drafts } = useSelector((state: RootState) => state.messages);
  const [message, setMessage] = useState(drafts[chatId] || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { startTyping, stopTyping } = useTyping(chatId);

  const emojis = [
    '😀', '😂', '🥰', '😍', '😎', '🤔', '😅', '😊',
    '👍', '👎', '❤️', '💕', '🔥', '💯', '👏', '🎉',
    '😢', '😭', '😡', '😱', '🤯', '😴', '🤤', '🙄'
  ];

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    // Update draft in store
    dispatch(updateDraft({ chatId, content: message }));
  }, [message, chatId, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

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

      // Also send via API for persistence
      await dispatch(sendMessage({
        chatId,
        content: messageContent,
        type: 'TEXT',
        replyTo: replyTo?.id
      }) as any);

      onScrollToBottom();
      
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      // Restore message on error
      setMessage(messageContent);
      console.error('Failed to send message:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      handleFileUpload(file);
    });

    // Clear input
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    try {
      // Create temporary message for optimistic update
      const tempId = `temp_${Date.now()}`;
      const fileUrl = URL.createObjectURL(file);
      
      let messageType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' = 'FILE';
      
      if (file.type.startsWith('image/')) {
        messageType = 'IMAGE';
      } else if (file.type.startsWith('video/')) {
        messageType = 'VIDEO';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'AUDIO';
      }

      // Send file message
      socketService.sendMessage({
        chatId,
        content: fileUrl,
        type: messageType
      });

      // TODO: Implement actual file upload to server
      
    } catch (error) {
      console.error('Failed to upload file:', error);
    }

    setShowAttachments(false);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // TODO: Implement voice recording
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Unable to access microphone');
    }
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // TODO: Process and send voice message
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'camera':
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*';
          fileInputRef.current.click();
        }
        break;
      case 'gallery':
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*,video/*';
          fileInputRef.current.click();
        }
        break;
      case 'file':
        if (fileInputRef.current) {
          fileInputRef.current.accept = '*/*';
          fileInputRef.current.click();
        }
        break;
      case 'location':
        // TODO: Implement location sharing
        break;
    }
    setShowAttachments(false);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFormValid = message.trim().length > 0 && !isSending;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/20 p-4">
      {/* Reply Banner */}
      {replyTo && (
        <div className="mb-3 p-3 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Replying to {replyTo.sender.firstName}
                </p>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 truncate">
                  {replyTo.content}
                </p>
              </div>
            </div>
            
            {onCancelReply && (
              <button
                onClick={onCancelReply}
                className="p-1 rounded-lg hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors"
              >
                <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Recording Interface */}
      {isRecording && (
        <div className="mb-3 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Recording... {formatRecordingTime(recordingTime)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={stopVoiceRecording}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Stop & Send
              </button>
              <button
                onClick={() => {
                  setIsRecording(false);
                  if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                  }
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
              showAttachments
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform duration-300 ${showAttachments ? 'rotate-45' : ''}`} />
          </button>

          {/* Attachment Menu */}
          {showAttachments && (
            <div className="absolute bottom-full left-0 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 py-2 z-50">
              <button
                onClick={() => handleQuickAction('camera')}
                className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Camera</span>
              </button>
              
              <button
                onClick={() => handleQuickAction('gallery')}
                className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Gallery</span>
              </button>
              
              <button
                onClick={() => handleQuickAction('file')}
                className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Document</span>
              </button>
              
              <button
                onClick={() => handleQuickAction('location')}
                className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors"
              >
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Location</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Container */}
        <div className="flex-1 relative">
          <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-600/30 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/30 transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-32"
              rows={1}
              disabled={isRecording}
            />
            
            {/* Input Actions */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center space-x-2">
                {/* Emoji Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
                      showEmojiPicker ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-4 z-50">
                      <div className="grid grid-cols-8 gap-2 w-64">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Character count (for long messages) */}
                {message.length > 500 && (
                  <span className={`text-xs ${
                    message.length > 1000 
                      ? 'text-red-500' 
                      : message.length > 800 
                        ? 'text-yellow-500' 
                        : 'text-gray-400'
                  }`}>
                    {message.length}/1000
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Voice Message Button */}
                {!message.trim() && (
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      isRecording 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!isFormValid}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                    isFormValid
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Click outside to close overlays */}
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