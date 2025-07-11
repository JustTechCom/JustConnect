// src/pages/Dashboard.tsx - Fixed with Safe Selectors
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
import { fetchMessages } from '../store/slices/messageSlice';
import { useAuth } from '../hooks/useAuth';
import { useUISelector } from '../hooks/useTypedSelector'; // Import the safe selector
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import { Menu, Search, Settings, Moon, Sun } from 'lucide-react';
import { toggleSidebar, toggleDarkMode } from '../store/slices/uiSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  // Use safe selectors
  const { 
    chats, 
    activeChat, 
    isLoading: chatsLoading 
  } = useSelector((state: RootState) => state.chats || { chats: [], activeChat: null, isLoading: false });
  
  // Use the safe UI selector
  const { 
    sidebarOpen, 
    isDarkMode 
  } = useUISelector();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch user's chats on component mount
    if (user) {
      dispatch(fetchChats());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Fetch messages when active chat changes
    if (activeChat) {
      dispatch(fetchMessages({ chatId: activeChat.id }));
    }
  }, [activeChat, dispatch]);

  const handleChatSelect = (chat: any) => {
    dispatch(setActiveChat(chat));
  };

  const filteredChats = (chats || []).filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(query) ||
      (chat.members || []).some(member => 
        member.user?.firstName?.toLowerCase().includes(query) ||
        member.user?.lastName?.toLowerCase().includes(query) ||
        member.user?.username?.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700`}>
          <Sidebar
            chats={filteredChats}
            activeChat={activeChat}
            onChatSelect={handleChatSelect}
            isLoading={chatsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {activeChat && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {activeChat.type === 'DIRECT' && activeChat.members?.[0]?.user
                          ? `${activeChat.members[0].user.firstName?.[0] || ''}${activeChat.members[0].user.lastName?.[0] || ''}`
                          : (activeChat.name?.[0] || 'C')}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeChat.type === 'DIRECT' && activeChat.members?.[0]?.user
                          ? `${activeChat.members[0].user.firstName || ''} ${activeChat.members[0].user.lastName || ''}`
                          : (activeChat.name || 'Unnamed Chat')}
                      </h1>
                      {activeChat.type === 'DIRECT' && activeChat.members?.[0]?.user && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeChat.members[0].user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => dispatch(toggleDarkMode())}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={isDarkMode ? 'Açık moda geç' : 'Koyu moda geç'}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {user && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.firstName || 'User'}
                      className="w-8 h-8 rounded-full ring-2 ring-blue-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
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