// frontend/src/components/Messages/MessageInput.tsx - Enhanced Modern Design
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  Send, 
  Mic, 
  Image, 
  File, 
  Smile, 
  Plus,
  X,
  Paperclip,
  MapPin,
  Camera,
  Video,
  Gift,
  Zap,
  Square,
  Play,
  Pause,
  StopCircle,
  RotateCcw
} from 'lucide-react';

interface MessageInputProps {
  chatId: string;
  onScrollToBottom: () => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  chatId,
  onScrollToBottom,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useSelector((state: RootState) => state.auth);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Set editing message content
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing start event
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Emit typing stop event
    }, 2000);
  }, [isTyping]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || isRecording) return;

    const messageData = {
      content: message.trim(),
      chatId,
      replyTo: replyingTo?.id,
      attachments: attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // In real app, upload to server first
      }))
    };

    // Send message logic here
    console.log('Sending message:', messageData);

    // Clear input
    setMessage('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachments(false);
    onCancelReply?.();
    onCancelEdit?.();
    onScrollToBottom();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    setShowAttachments(false);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setIsPaused(false);
      
      mediaRecorder.ondataavailable = (event) => {
        // Handle recording data
        console.log('Recording data:', event.data);
      };
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡', '🎉', '🔥', '💯', '✨'];

  return (
    <div className="relative">
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-primary-500/20 border-2 border-dashed border-primary-500 rounded-3xl flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-12 h-12 text-primary-500 mx-auto mb-2" />
            <p className="text-primary-700 dark:text-primary-300 font-medium">Dosyaları buraya bırakın</p>
          </div>
        </div>
      )}

      {/* Reply/Edit indicator */}
      {(replyingTo || editingMessage) && (
        <div className="mx-6 mb-3">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
                  {editingMessage ? 'Mesajı düzenle' : `${replyingTo?.sender.firstName} kullanıcısına yanıt`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {editingMessage ? editingMessage.content : replyingTo?.content}
                </p>
              </div>
              <button
                onClick={editingMessage ? onCancelEdit : onCancelReply}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mx-6 mb-3">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ekli dosyalar ({attachments.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {attachments.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-16 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                        <File className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div 
        className="p-6 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/30"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isRecording ? (
          /* Recording interface */
          <div className="flex items-center space-x-4 bg-red-50 dark:bg-red-900/20 rounded-3xl p-4">
            <div className="flex-1 flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-lg font-semibold text-red-600 dark:text-red-400">
                {formatRecordingTime(recordingTime)}
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">
                {isPaused ? 'Duraklatıldı' : 'Kaydediliyor'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={pauseRecording}
                className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              
              <button
                onClick={stopRecording}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  stopRecording();
                  // Send recording
                }}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal input interface */
          <div className="flex items-end space-x-3">
            {/* Attachment button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 ${
                  showAttachments
                    ? 'bg-primary-500 text-white shadow-glow-primary'
                    : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <Plus className={`w-5 h-5 transition-transform duration-300 ${showAttachments ? 'rotate-45' : ''}`} />
              </button>

              {/* Attachment menu */}
              {showAttachments && (
                <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 p-2 animate-scale-in z-10">
                  <div className="grid grid-cols-2 gap-2 w-48">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Dosya</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Fotoğraf</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Kamera</span>
                    </button>
                    
                    <button className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">Konum</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Text input area */}
            <div className="flex-1 relative">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-soft hover:shadow-medium transition-all duration-300 focus-within:shadow-glow-primary focus-within:border-primary-300 dark:focus-within:border-primary-600">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="w-full p-4 pr-12 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-32 scrollbar-hide"
                  rows={1}
                />

                {/* Emoji button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    showEmojiPicker
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 p-4 animate-scale-in z-10">
                  <div className="grid grid-cols-6 gap-2 w-64">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice/Send button */}
            {message.trim() || attachments.length > 0 ? (
              <button
                onClick={handleSendMessage}
                className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl shadow-medium hover:shadow-strong hover:scale-110 active:scale-95 transition-all duration-200 hover:from-primary-600 hover:to-primary-700"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-medium hover:shadow-strong hover:scale-110 active:scale-95 transition-all duration-200 hover:from-red-600 hover:to-red-700"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
};

export default MessageInput;