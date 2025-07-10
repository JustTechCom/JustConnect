// frontend/src/pages/Dashboard.tsx - Enhanced Modern Design
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
import { fetchMessages } from '../store/slices/messageSlice';
import { toggleSidebar, toggleDarkMode } from '../store/slices/uiSlice';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import { 
  Menu, 
  Search, 
  Settings, 
  Moon, 
  Sun, 
  Bell,
  Users,
  MessageCircle,
  Zap,
  Sparkles,
  Coffee,
  Activity,
  Wifi,
  WifiOff,
  Plus
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { 
    chats, 
    activeChat, 
    isLoading: chatsLoading 
  } = useSelector((state: RootState) => state.chats);
  const { 
    sidebarOpen, 
    isDarkMode 
  } = useSelector((state: RootState) => state.ui);

  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      dispatch(fetchMessages({ chatId: activeChat.id }));
    }
  }, [activeChat, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Focus search
            document.querySelector('input[placeholder*="ara"]')?.focus();
            break;
          case 'n':
            e.preventDefault();
            setShowQuickActions(true);
            break;
          case 'd':
            e.preventDefault();
            dispatch(toggleDarkMode());
            break;
          case 'b':
            e.preventDefault();
            dispatch(toggleSidebar());
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowQuickActions(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dispatch]);

  const handleChatSelect = useCallback((chat: any) => {
    dispatch(setActiveChat(chat));
  }, [dispatch]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(query) ||
      chat.members.some(member => 
        member.user.firstName.toLowerCase().includes(query) ||
        member.user.lastName.toLowerCase().includes(query) ||
        member.user.username.toLowerCase().includes(query)
      )
    );
  });

  const unreadCount = chats.filter(chat => chat.unreadCount > 0).length;

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Background with mesh gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="fixed inset-0 bg-mesh-primary opacity-5 dark:opacity-10" />
      
      {/* Connection status indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-strong animate-slide-down">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>Bağlantı yok</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex w-full">
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {activeChat ? 'Chat' : 'JustConnect'}
              </h1>
              {unreadCount > 0 && (
                <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <button className="p-2 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-80 h-full transition-transform duration-300 ease-spring`}>
          <Sidebar
            chats={filteredChats}
            activeChat={activeChat}
            onChatSelect={handleChatSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={chatsLoading}
          />
        </div>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20 animate-fade-in"
            onClick={() => dispatch(toggleSidebar())}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center space-x-4">
              {activeChat ? (
                <div className="flex items-center space-x-3">
                  <img
                    src={activeChat.avatar || '/default-avatar.png'}
                    alt={activeChat.name}
                    className="w-10 h-10 rounded-full ring-2 ring-white/30 dark:ring-gray-600/30"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {activeChat.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeChat.type === 'group' 
                        ? `${activeChat.members.length} üye` 
                        : 'Aktif'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    JustConnect
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Modern mesajlaşma deneyimi
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Connection status */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                isOnline 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {isOnline ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </div>

              {/* Quick actions */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 relative"
              >
                <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {showQuickActions && (
                  <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 p-2 animate-scale-in min-w-[200px]">
                    <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Yeni Sohbet</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Grup Oluştur</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">AI Asistan</span>
                    </button>
                  </div>
                )}
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full">
                    <div className="w-full h-full bg-red-400 rounded-full animate-ping" />
                  </div>
                )}
              </button>

              {/* Settings */}
              <button className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Chat content */}
          <div className="flex-1 relative pt-16 lg:pt-0">
            {activeChat ? (
              <ChatArea chat={activeChat} />
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <WelcomeScreen 
                  onNewChat={() => setShowQuickActions(true)}
                  user={user}
                  stats={{
                    totalChats: chats.length,
                    unreadCount,
                    activeUsers: chats.reduce((acc, chat) => 
                      acc + chat.members.filter(m => m.user.isOnline).length, 0
                    )
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating action button for mobile */}
      <button
        onClick={() => setShowQuickActions(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary text-white rounded-full shadow-strong hover:shadow-glow-primary transition-all duration-300 hover:scale-110 active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 mx-auto" />
      </button>

      {/* Quick actions modal for mobile */}
      {showQuickActions && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-3xl p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hızlı İşlemler</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Yeni Sohbet</span>
              </button>
              
              <button className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Grup Oluştur</span>
              </button>
              
              <button className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Asistan</span>
              </button>
              
              <button className="flex flex-col items-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                <Coffee className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Kahve Molası</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts info */}
      <div className="hidden lg:block fixed bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-2">
        <div className="space-y-1">
          <div>⌘+K Ara</div>
          <div>⌘+N Yeni</div>
          <div>⌘+D Tema</div>
          <div>⌘+B Kenar</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;