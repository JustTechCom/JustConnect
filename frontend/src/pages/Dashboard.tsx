// frontend/src/pages/Dashboard.tsx - Çift header sorunu düzeltmesi

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import WelcomeScreen from '../components/Chat/WelcomeScreen';
import { Menu, Search, Settings, Moon, Sun } from 'lucide-react';
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

  useEffect(() => {
    // Fetch user's chats on component mount
    dispatch(fetchChats());
  }, [dispatch]);

  const handleChatSelect = (chat: any) => {
    dispatch(setActiveChat(chat));
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
      <div className="flex w-full bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden`}>
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
        <div className="flex-1 flex flex-col">
          {/* DÜZELTME: Basit top header - chat bilgileri kaldırıldı */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {/* SADECE BAŞLIK */}
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  JustConnect
                </h1>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                <button 
                  onClick={() => dispatch(toggleDarkMode())}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </header>

          {/* Chat Area - BURASI DEĞİŞMEDİ */}
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