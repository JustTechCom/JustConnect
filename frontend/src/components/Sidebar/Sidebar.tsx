import React, { useState } from 'react';
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
  Bell
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

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user?.avatar || '/default-avatar.png'}
                alt={user?.firstName}
                className="w-10 h-10 rounded-full ring-2 ring-blue-500 cursor-pointer"
                onClick={() => setShowUserMenu(!showUserMenu)}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
              
              {/* User Menu */}
              {showUserMenu && (
                <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user?.username}
                    </p>
                  </div>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profil</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Ayarlar</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2">
                    <Archive className="w-4 h-4" />
                    <span>Arşivlenenler</span>
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Sohbetler
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chats.length} sohbet
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Yeni sohbet"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sohbetlerde ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-2">
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MessageCircle className="w-5 h-5 text-blue-600 mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">Yeni</span>
          </button>
          
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Users className="w-5 h-5 text-green-600 mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">Grup</span>
          </button>
          
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Archive className="w-5 h-5 text-yellow-600 mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">Arşiv</span>
          </button>
          
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="w-5 h-5 text-purple-600 mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">Bildirim</span>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Henüz sohbetiniz yok
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              İlk sohbetinizi başlatın
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onClick={() => onChatSelect(chat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <UserSearch
          onClose={() => setShowNewChatModal(false)}
          onSelectUser={(user) => {
            // Handle new chat creation
            console.log('Creating chat with:', user);
            setShowNewChatModal(false);
          }}
        />
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;