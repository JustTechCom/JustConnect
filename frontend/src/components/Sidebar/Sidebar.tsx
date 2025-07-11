// frontend/src/components/Sidebar/Sidebar.tsx - Modern Sidebar
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Chat } from '../../types';
import ChatItem from './ChatItem';
import { useUISelector } from '../../store/hooks/useTypedSelector'; // ✅

import { 
  Search, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  MessageCircle,
  Users,
  Archive,
  Bell,
  Pin,
  Filter,
  MoreVertical,
  Moon,
  Sun,
  Smile,
  Sparkles,
  Crown
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChat,
  onChatSelect,
  searchQuery,
  onSearchChange,
  isLoading
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useUISelector();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  const handleLogout = () => {
    dispatch(logout());
  };

  const getFilteredChats = () => {
    let filtered = chats;
    
    switch (filter) {
      case 'unread':
        filtered = chats.filter(chat => chat.unreadCount > 0);
        break;
      case 'pinned':
        filtered = chats.filter(chat => chat.isPinned);
        break;
      default:
        filtered = chats;
    }

    // Sort by priority: pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const bTime = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return bTime - aTime;
    });
  };

  const filteredChats = getFilteredChats();
  const unreadCount = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 backdrop-blur-sm text-sm placeholder-gray-500 dark:placeholder-gray-400"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="flex bg-gray-100/60 dark:bg-gray-800/60 rounded-xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 text-sm font-medium ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            All
            {chats.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs rounded-full">
                {chats.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 text-sm font-medium ${
              filter === 'unread'
                ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setFilter('pinned')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 text-sm font-medium ${
              filter === 'pinned'
                ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Pin className="w-3 h-3 mr-1" />
            Pinned
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChats.length > 0 ? (
          <>
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => onChatSelect(chat)}
              />
            ))}
          </>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Try searching with different keywords
            </p>
          </div>
        ) : filter === 'unread' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No unread messages
            </p>
          </div>
        ) : filter === 'pinned' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Pin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No pinned chats
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Pin important conversations for quick access
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Start your first conversation by clicking "New Chat"
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Start Chatting
            </button>
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-white/20 dark:border-gray-700/20">
        <div className="relative">
          <div 
            className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                alt={user?.firstName}
                className="w-10 h-10 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              
              {/* Premium badge */}
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </h3>
                <Sparkles className="w-3 h-3 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{user?.username}
              </p>
            </div>
            
            <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </div>

          {/* User Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-gray-700/20 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                      alt={user?.firstName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user?.username}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Pro Member</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="py-1">
                <button className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Profile</span>
                </button>
                
                <button className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Settings</span>
                </button>
                
                <button className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors">
                  <Archive className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Archived Chats</span>
                </button>
                
                <button className="w-full px-4 py-3 text-left hover:bg-gray-100/60 dark:hover:bg-gray-700/60 flex items-center space-x-3 transition-colors">
                  {isDarkMode ? <Sun className="w-4 h-4 text-gray-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
                  <span className="text-gray-700 dark:text-gray-300">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
                
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;