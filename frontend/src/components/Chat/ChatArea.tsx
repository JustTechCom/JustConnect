// frontend/src/components/Chat/ChatArea.tsx - Modern Chat Interface
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Chat } from '../../types';
import { fetchMessages, sendMessage, setReplyToMessage } from '../../store/slices/messageSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import { 
  Phone, 
  Video, 
  Info, 
  Search,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  VolumeX,
  Volume2,
  UserPlus,
  Settings,
  Share,
  Star
} from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat }) => {
  const dispatch = useDispatch();
  const { messages, isLoading, replyToMessage } = useSelector((state: RootState) => state.messages);
  const { typingUsers } = useSelector((state: RootState) => state.chats);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showSearchMessages, setShowSearchMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessages = messages[chat.id] || [];
  const isTyping = typingUsers[chat.id] && typingUsers[chat.id].length > 0;

  useEffect(() => {
    // Fetch messages when chat changes
    if (chat.id) {
      dispatch(fetchMessages({ chatId: chat.id }) as any);
    }
  }, [chat.id, dispatch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  const handleCancelReply = () => {
    dispatch(setReplyToMessage(null));
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

  const getLastSeen = () => {
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
      return `${onlineCount} of ${chat.members.length} online`;
    }
    
    return '';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      {/* Chat Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Chat Info */}
          <div className="flex items-center space-x-4">
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
              
              {/* Chat type indicators */}
              {chat.type === 'GROUP' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{chat.members.length}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {getChatName()}
                </h1>
                {chat.isVerified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                )}
                {chat.isPinned && (
                  <Pin className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getLastSeen()}
                </p>
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-1 text-blue-500">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-100" />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
                    </div>
                    <span className="text-xs">
                      {typingUsers[chat.id]?.length === 1 
                        ? `${typingUsers[chat.id][0]} is typing...`
                        : `${typingUsers[chat.id]?.length} people are typing...`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Voice/Video Call Buttons */}
            {chat.type === 'DIRECT' && (
              <>
                <button className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 text-green-600">
                  <Phone className="w-5 h-5" />
                </button>
                
                <button className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 text-blue-600">
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Search Messages */}
            <button 
              onClick={() => setShowSearchMessages(!showSearchMessages)}
              className={`p-2.5 rounded-xl border border-white/20 dark:border-gray-600/20 transition-all duration-300 hover:scale-105 ${
                showSearchMessages 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* Chat Info */}
            <button 
              onClick={() => setShowChatInfo(!showChatInfo)}
              className={`p-2.5 rounded-xl border border-white/20 dark:border-gray-600/20 transition-all duration-300 hover:scale-105 ${
                showChatInfo 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-600 dark:text-gray-300'
              }`}
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
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                  <Pin className="w-4 h-4" />
                  <span>{chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                </button>
                
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                  {chat.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{chat.isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                
                {chat.type === 'GROUP' && (
                  <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                    <UserPlus className="w-4 h-4" />
                    <span>Add Members</span>
                  </button>
                )}
                
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                  <Share className="w-4 h-4" />
                  <span>Share Chat</span>
                </button>
                
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3">
                  <Archive className="w-4 h-4" />
                  <span>Archive Chat</span>
                </button>
                
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1" />
                
                <button className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar (when active) */}
      {showSearchMessages && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 px-6 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search in this chat..."
              className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-white/30 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyToMessage && (
        <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border-b border-blue-200/50 dark:border-blue-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-12 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Replying to {replyToMessage.sender.firstName}
                </p>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 truncate max-w-md">
                  {replyToMessage.content}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCancelReply}
              className="p-1 rounded-lg hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors"
            >
              <span className="text-blue-600 dark:text-blue-400 text-lg">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 flex">
        {/* Main Messages */}
        <div className="flex-1 flex flex-col">
          <MessageList 
            chatId={chat.id}
            messages={chatMessages}
            isLoading={isLoading}
          />
          <div ref={messagesEndRef} />
          
          {/* Message Input */}
          <MessageInput 
            chatId={chat.id}
            onScrollToBottom={scrollToBottom}
            replyTo={replyToMessage}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* Chat Info Sidebar */}
        {showChatInfo && (
          <div className="w-80 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-l border-white/20 dark:border-gray-700/20">
            <ChatInfo 
              chat={chat} 
              onClose={() => setShowChatInfo(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Chat Info Component
const ChatInfo: React.FC<{ chat: Chat; onClose: () => void }> = ({ chat, onClose }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Info</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Chat Avatar & Name */}
        <div className="text-center">
          <img
            src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name || 'Chat'}&background=6366f1&color=ffffff&rounded=true&bold=true`}
            alt={chat.name}
            className="w-24 h-24 rounded-2xl mx-auto mb-4 shadow-lg"
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {chat.name || 'Unnamed Chat'}
          </h3>
          {chat.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{chat.description}</p>
          )}
        </div>

        {/* Members */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Members ({chat.members.length})
          </h4>
          <div className="space-y-3">
            {chat.members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                <img
                  src={member.user.avatar || `https://ui-avatars.com/api/?name=${member.user.firstName}+${member.user.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                  alt={member.user.firstName}
                  className="w-10 h-10 rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.user.firstName} {member.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{member.user.username}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {member.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Settings</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors">
              <span className="text-gray-700 dark:text-gray-300">Notifications</span>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors">
              <span className="text-gray-700 dark:text-gray-300">Media & Files</span>
              <span className="text-sm text-gray-400">12 files</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;