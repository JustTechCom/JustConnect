// frontend/src/components/Sidebar/Sidebar.tsx - Enhanced Modern Design
import React, { useState, useEffect } from 'react';
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
  Moon,
  Sun,
  Filter,
  MoreVertical,
  Sparkles,
  Zap
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
  const { isDarkMode } = useSelector((state: RootState) => state.ui);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const handleLogout = () => {
    dispatch(logout());
  };

  const unreadCount = chats.filter(chat => chat.unreadCount > 0).length;
  const archivedChats = chats.filter(chat => chat.isArchived);
  
  const filteredChats = chats.filter(chat => {
    if (!searchQuery && selectedFilter === 'all') return !chat.isArchived;
    if (selectedFilter === 'unread') return chat.unreadCount > 0;
    if (selectedFilter === 'archived') return chat.isArchived;
    
    if (!searchQuery) return !chat.isArchived;
    
    const query = searchQuery.toLowerCase();
    return (
      (chat.name?.toLowerCase().includes(query) ||
      chat.members.some(member => 
        member.user.firstName.toLowerCase().includes(query) ||
        member.user.lastName.toLowerCase().includes(query) ||
        member.user.username.toLowerCase().includes(query)
      )) && (selectedFilter === 'all' ? !chat.isArchived : true)
    );
  });

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu || showSettings) {
        setShowUserMenu(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showSettings]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="absolute inset-0 bg-mesh-primary opacity-5 dark:opacity-10" />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 glass backdrop-blur-xl dark:glass-dark" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-white/10 to-white/5 dark:from-gray-800/10 dark:to-gray-900/5">
          <div className="flex items-center justify-between mb-6">
            {/* User Profile Section */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-pulse-slow" />
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.firstName}
                  className="relative w-12 h-12 rounded-full ring-2 ring-white/30 dark:ring-gray-600/30 cursor-pointer hover:ring-primary-400/50 transition-all duration-300 hover:scale-105"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                />
                <div className="absolute -bottom-1 -right-1">
                  <div className="online-status-enhanced"></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl glass hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 hover:scale-105 group"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
              </button>
              
              <button
                onClick={() => setShowNewChatModal(true)}
                className="btn btn-primary px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-medium">Yeni</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search */}
          <div className="relative group">
            <div className={`absolute inset-0 bg-gradient-primary rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${searchFocused ? 'opacity-20' : ''}`} />
            <div className="relative flex items-center">
              <Search className={`absolute left-4 w-5 h-5 transition-all duration-300 ${
                searchFocused ? 'text-primary-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Sohbet veya kişi ara..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="input-enhanced w-full pl-12 pr-4 bg-white/50 dark:bg-gray-800/50 border-0 focus:bg-white/80 dark:focus:bg-gray-800/80"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-4 border-b border-white/10 dark:border-gray-700/20">
          <div className="flex space-x-1 bg-white/30 dark:bg-gray-800/30 rounded-2xl p-1 backdrop-blur-sm">
            {[
              { key: 'all', label: 'Tümü', icon: MessageCircle, count: chats.filter(c => !c.isArchived).length },
              { key: 'unread', label: 'Okunmamış', icon: Bell, count: unreadCount },
              { key: 'archived', label: 'Arşiv', icon: Archive, count: archivedChats.length }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedFilter === filter.key;
              
              return (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-gray-700 shadow-medium text-primary-600 dark:text-primary-400 scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{filter.label}</span>
                  {filter.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {filter.count > 99 ? '99+' : filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-b border-white/10 dark:border-gray-700/20">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Sparkles, label: 'AI Chat', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { icon: Users, label: 'Grup', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
              { icon: Zap, label: 'Hızlı', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
              { icon: Archive, label: 'Arşiv', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className={`flex flex-col items-center p-3 rounded-2xl ${action.bg} hover:scale-105 active:scale-95 transition-all duration-200 group hover:shadow-soft`}
                >
                  <Icon className={`w-5 h-5 ${action.color} mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-modern">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-4 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg w-3/4"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full opacity-10 animate-morphing"></div>
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery ? 'Sonuç bulunamadı' : selectedFilter === 'all' ? 'Henüz sohbetiniz yok' : 
                 selectedFilter === 'unread' ? 'Okunmamış mesaj yok' : 'Arşivlenmiş sohbet yok'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {searchQuery ? 'Farklı anahtar kelimeler deneyin' :
                 selectedFilter === 'all' ? 'Yeni bir sohbet başlatarak başlayın' :
                 selectedFilter === 'unread' ? 'Tüm mesajlarınızı okudunuz' : 'Arşivlenmiş sohbet bulunmuyor'}
              </p>
              {!searchQuery && selectedFilter === 'all' && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn btn-primary hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk sohbetinizi başlatın
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat, index) => (
                <div
                  key={chat.id}
                  className="animate-slide-in-bottom"
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
          )}
        </div>

        {/* User Menu */}
        {showUserMenu && (
          <div className="absolute top-20 left-6 right-6 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-white/20 dark:border-gray-700/30 backdrop-blur-xl overflow-hidden animate-slide-down">
              <div className="p-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Profil</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Ayarlar</span>
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                >
                  <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowNewChatModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-strong border border-white/20 dark:border-gray-700/30 w-full max-w-md animate-scale-in">
              <UserSearch
                onClose={() => setShowNewChatModal(false)}
                onSelectUser={(user) => {
                  console.log('Creating chat with:', user);
                  setShowNewChatModal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;