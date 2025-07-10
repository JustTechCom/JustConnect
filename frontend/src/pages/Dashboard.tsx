// frontend/src/pages/Dashboard.tsx - Modern Professional Design

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchChats, setActiveChat } from '../store/slices/chatSlice';
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
  ArrowLeft,
  Plus,
  Bell,
  Users,
  Video,
  Phone
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
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

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
    dispatch(fetchChats());
  }, [dispatch]);

  const handleChatSelect = (chat: any) => {
    dispatch(setActiveChat(chat));
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
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Modern Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/20 via-transparent to-purple-100/20"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative h-screen flex">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => dispatch(toggleSidebar())}
          />
        )}

        {/* Modern Sidebar */}
        <div className={`${
          isMobile 
            ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-500 ease-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-500 ease-out flex-shrink-0`
        } overflow-hidden`}>
          <div className="h-full glass-card-sm border-r-0 rounded-r-none backdrop-blur-xl">
            <Sidebar
              chats={filteredChats}
              activeChat={activeChat}
              onChatSelect={handleChatSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={chatsLoading}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Modern Top Header */}
          <header className="glass-card-sm border-x-0 border-t-0 rounded-none backdrop-blur-xl">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center space-x-4">
                  {/* Mobile Navigation */}
                  {isMobile && activeChat ? (
                    <button
                      onClick={handleBackToChats}
                      className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 group"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => dispatch(toggleSidebar())}
                      className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 group"
                    >
                      <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </button>
                  )}
                  
                  {/* Modern Logo & Title */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">J</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {isMobile && activeChat 
                          ? (activeChat.name || 
                             (activeChat.type === 'DIRECT' && activeChat.members.length > 0
                               ? `${activeChat.members[0].user.firstName} ${activeChat.members[0].user.lastName}`
                               : 'Chat'))
                          : 'JustConnect'
                        }
                      </h1>
                      {!isMobile || !activeChat ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Professional Messaging</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2">
                  {/* Quick Actions */}
                  {!(isMobile && activeChat) && (
                    <>
                      <button className="p-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 group relative">
                        <Search className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </button>
                      
                      <button className="p-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 group relative">
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                      </button>
                    </>
                  )}
                  
                  {/* Dark Mode Toggle */}
                  <button 
                    onClick={() => dispatch(toggleDarkMode())}
                    className="p-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 group"
                  >
                    {isDarkMode ? (
                      <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600" />
                    )}
                  </button>
                  
                  {/* Settings */}
                  {!(isMobile && activeChat) && (
                    <div className="relative">
                      <button 
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="p-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 group"
                      >
                        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </button>
                      
                      {/* Quick Actions Dropdown */}
                      {showQuickActions && (
                        <div className="absolute right-0 top-full mt-2 w-48 glass-card-sm p-2 animate-slide-up">
                          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">New Group</span>
                          </button>
                          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Add Contact</span>
                          </button>
                          <hr className="my-2 border-gray-200/50 dark:border-gray-700/50" />
                          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* User Avatar */}
                  <div className="avatar ml-2">
                    <img
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.firstName}
                      className="w-9 h-9 rounded-xl hover:scale-105 transition-transform duration-200"
                    />
                    <div className="status-indicator status-online"></div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden relative">
            {activeChat ? (
              <div className="animate-slide-right">
                <ChatArea key={activeChat.id} chat={activeChat} />
              </div>
            ) : (
              <div className="animate-slide-up">
                <WelcomeScreen />
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button - Mobile */}
        {isMobile && !activeChat && (
          <button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center z-30">
            <Plus className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Click outside to close quick actions */}
      {showQuickActions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowQuickActions(false)}
        />
      )}
      
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;