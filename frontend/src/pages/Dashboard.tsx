// frontend/src/pages/Dashboard.tsx - Mobil responsive düzeltmesi

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import { Menu, Search, Settings, Moon, Sun, ArrowLeft } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Fetch user's chats on component mount
    dispatch(fetchChats());
  }, [dispatch]);

  const handleChatSelect = (chat: any) => {
    dispatch(setActiveChat(chat));
    
    // On mobile, close sidebar when chat is selected
    if (isMobile && sidebarOpen) {
      dispatch(toggleSidebar());
    }
  };

  const handleBackToChats = () => {
    dispatch(setActiveChat(null));
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

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

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-900 relative">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => dispatch(toggleSidebar())}
          />
        )}

        {/* Sidebar */}
        <div className={`${
          isMobile 
            ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0`
        } overflow-hidden`}>
          <Sidebar
            chats={filteredChats}
            activeChat={activeChat}
            onChatSelect={handleChatSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={chatsLoading}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header - Mobil responsive */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile: Back button when chat is active, Menu when not */}
                {isMobile && activeChat ? (
                  <button
                    onClick={handleBackToChats}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                ) : (
                  <button
                    onClick={() => dispatch(toggleSidebar())}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                
                {/* Title */}
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {isMobile && activeChat 
                    ? (activeChat.name || 
                       (activeChat.type === 'DIRECT' && activeChat.members.length > 0
                         ? `${activeChat.members[0].user.firstName} ${activeChat.members[0].user.lastName}`
                         : 'Chat'))
                    : 'JustConnect'
                  }
                </h1>
              </div>

              {/* Action buttons - Hide some on mobile */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Search - Hidden on mobile when chat is active */}
                {!(isMobile && activeChat) && (
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                
                {/* Dark mode toggle */}
                <button 
                  onClick={() => dispatch(toggleDarkMode())}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                
                {/* Settings - Hidden on mobile when chat is active */}
                {!(isMobile && activeChat) && (
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            {activeChat ? (
              <ChatArea key={activeChat.id} chat={activeChat} />
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