// frontend/src/pages/Dashboard.tsx - Modern Professional Design
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
import { fetchMessages } from '../store/slices/messageSlice';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import FriendsPanel from '../components/Friends/FriendsPanel';
import { 
  Menu, 
  Search, 
  Settings, 
  Moon, 
  Sun, 
  Users, 
  MessageCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { toggleSidebar, toggleDarkMode } from '../store/slices/uiSlice';

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
  const [activePanel, setActivePanel] = useState<'chats' | 'friends'>('chats');

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  useEffect(() => {
    if (activeChat) {
      dispatch(fetchMessages({ chatId: activeChat.id }));
    }
  }, [activeChat, dispatch]);

  const handleChatSelect = (chat: any) => {
    dispatch(setActiveChat(chat));
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(query) ||
      chat.members.some((member: any) => 
        member.user.firstName.toLowerCase().includes(query) ||
        member.user.lastName.toLowerCase().includes(query) ||
        member.user.username.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Background with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900" />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="relative flex w-full z-10">
        
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-500 ease-out flex-shrink-0 overflow-hidden backdrop-blur-sm`}>
          <div className="h-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      JustConnect
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Professional Messaging</p>
                  </div>
                </div>
                
                <button
                  onClick={() => dispatch(toggleDarkMode())}
                  className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:scale-105"
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              </div>

              {/* User Profile Card */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl p-4 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                      alt={user?.firstName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{user?.username}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Pro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="p-4">
              <div className="flex bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-1 backdrop-blur-sm">
                <button
                  onClick={() => setActivePanel('chats')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                    activePanel === 'chats'
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium">Chats</span>
                  {chats.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {chats.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActivePanel('friends')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                    activePanel === 'friends'
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Friends</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    5
                  </span>
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'chats' ? (
                <Sidebar
                  chats={filteredChats}
                  activeChat={activeChat}
                  onChatSelect={handleChatSelect}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isLoading={chatsLoading}
                />
              ) : (
                <FriendsPanel />
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:scale-105"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {activeChat && (
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.name || 'Chat'}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                        alt={activeChat.name || 'Chat'}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
                      />
                      {activeChat.type === 'DIRECT' && activeChat.members.length > 0 && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                          activeChat.members[0].user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeChat.name || 
                         (activeChat.type === 'DIRECT' && activeChat.members.length > 0
                           ? `${activeChat.members[0].user.firstName} ${activeChat.members[0].user.lastName}`
                           : 'Unnamed Chat')}
                      </h1>
                      {activeChat.type === 'DIRECT' && activeChat.members.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            activeChat.members[0].user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span>
                            {activeChat.members[0].user.isOnline ? 'Online' : 'Last seen recently'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="pl-10 pr-4 py-2 w-64 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 backdrop-blur-sm text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Quick Actions */}
                <button className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:scale-105">
                  <Zap className="w-5 h-5 text-orange-500" />
                </button>
                
                <button className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:scale-105">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </header>

          {/* Chat Content */}
          <div className="flex-1 relative">
            {activeChat ? (
              <ChatArea chat={activeChat} />
            ) : (
              <WelcomeScreen />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;