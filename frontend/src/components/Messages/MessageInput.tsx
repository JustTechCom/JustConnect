import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { sendMessage } from '../../store/slices/messageSlice';
import { useTyping } from '../../hooks';
import socketService from '../../services/socketService';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  File,
  X,
  Plus
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
  const { isSending } = useSelector((state: RootState) => state.messages);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      }));

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
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload
      console.log('File selected:', file);
      // TODO: Implement file upload
    }
    setShowAttachments(false);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // TODO: Stop recording and send voice message
    } else {
      setIsRecording(true);
      // TODO: Start voice recording
    }
  };

  const isMessageEmpty = !message.trim();

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {replyTo.sender.firstName} {replyTo.sender.lastName} kişisine yanıt
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Options */}
      {showAttachments && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center p-4 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Image className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Fotoğraf</span>
            </button>
            
            <button className="flex flex-col items-center p-4 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <File className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Dosya</span>
            </button>
            
            <button
              onClick={handleVoiceRecord}
              className="flex flex-col items-center p-4 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Mic className={`w-8 h-8 mb-2 ${isRecording ? 'text-red-600' : 'text-purple-600'}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isRecording ? 'Kaydediliyor...' : 'Ses'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className={`p-2 rounded-lg transition-colors ${
            showAttachments 
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {showAttachments ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{ 
              minHeight: '48px',
              maxHeight: '120px'
            }}
          />
          
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`absolute right-3 bottom-3 p-1 rounded transition-colors ${
              showEmojiPicker 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send/Voice Button */}
        {isMessageEmpty ? (
          <button
            onClick={handleVoiceRecord}
            className={`p-3 rounded-full transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSending ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Click outside to close menus */}
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