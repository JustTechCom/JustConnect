// frontend/src/components/Sidebar/Sidebar.tsx - Modern Professional Design

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Chat } from '../../types';
import ChatItem from './ChatItem';
import UserSearch from './UserSearch';
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
  Filter,
  MoreHorizontal,
  Star,
  Clock
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const filteredChats = chats.filter(chat => {
    switch (activeFilter) {
      case 'unread':
        return chat.unreadCount > 0;
      case 'groups':
        return chat.type === 'GROUP';
      case 'archived':
        return chat.archived;
      default:
        return !chat.archived;
    }
  });

  const chatStats = {
    total: chats.length,
    unread: chats.filter(chat => chat.unreadCount > 0).length,
    groups: chats.filter(chat => chat.type === 'GROUP').length,
    archived: chats.filter(chat => chat.archived).length
  };

  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
      {/* Modern Header */}
      <div className="p-4 border-b border-white/10 dark:border-gray-700/50">
        {/* User Profile Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="avatar">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.firstName}
                  className="w-12 h-12 rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                />
                <div className="status-indicator status-online"></div>
              </div>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 glass-card p-2 animate-slide-up z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user?.username}
                    </p>
                  </div>
                  
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2">
                    <Archive className="w-4 h-4" />
                    <span className="text-sm">Archived</span>
                  </button>
                  
                  <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 group"
                  >
                    <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Chats
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chatStats.total} conversations
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors relative"
            >
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {activeFilter !== 'all' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
              )}
            </button>
            
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Modern Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="modern-input w-full pl-11 pr-4 py-3 text-sm placeholder-gray-400"
          />
        </div>

        {/* Filter Tabs */}
        {showFilters && (
          <div className="animate-slide-up mb-4">
            <div className="flex space-x-2 p-1 bg-gray-100/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
              {[
                { key: 'all', label: 'All', count: chatStats.total },
                { key: 'unread', label: 'Unread', count: chatStats.unread },
                { key: 'groups', label: 'Groups', count: chatStats.groups },
                { key: 'archived', label: 'Archived', count: chatStats.archived }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeFilter === filter.key
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      activeFilter === filter.key
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card-sm p-3 text-center">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {chatStats.unread}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Unread</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {chatStats.groups}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Groups</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {chats.filter(c => c.isPinned).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pinned</div>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-2 p-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-1 py-2">
            {filteredChats.map((chat, index) => (
              <div 
                key={chat.id} 
                className="animate-slide-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ChatItem
                  chat={chat}
                  isActive={activeChat?.id === chat.id}
                  onClick={() => onChatSelect(chat)}
                />
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeFilter === 'all' ? 'No conversations yet' : `No ${activeFilter} chats`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {activeFilter === 'all' 
                ? 'Start a new conversation to get started'
                : `You don't have any ${activeFilter} conversations`
              }
            </p>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="btn-primary px-6 py-2 text-sm"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* Bottom Quick Actions */}
      <div className="p-4 border-t border-white/10 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Star className="w-4 h-4" />
            <span>Starred</span>
          </button>
          
          <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </button>
          
          <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showFilters) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowFilters(false);
          }}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <UserSearch onClose={() => setShowNewChatModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;