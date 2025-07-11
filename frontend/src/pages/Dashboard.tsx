// frontend/src/pages/Dashboard.tsx - Eksik ana sayfa
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  Search,
  Plus,
  User,
  LogOut
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('chats');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                JustConnect
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:block">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden md:block">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                    activeTab === 'chats'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Sohbetler</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                    activeTab === 'contacts'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Kişiler</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Ayarlar</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm min-h-[600px]">
              
              {activeTab === 'chats' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sohbetler
                    </h2>
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      <span>Yeni Sohbet</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Henüz sohbet yok
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Arkadaşlarınızla sohbet etmeye başlamak için yeni bir sohbet başlatın
                      </p>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                        İlk Sohbeti Başlat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Kişiler
                    </h2>
                    <div className="flex space-x-2">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Kişi ara..."
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        <span>Arkadaş Ekle</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Henüz arkadaş yok
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Arkadaş ekleyerek sohbet etmeye başlayın
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Ayarlar
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Profil Ayarları
                      </h3>
                      <button
                        onClick={() => navigate('/profile')}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Profili Düzenle
                      </button>
                    </div>

                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Bildirim Ayarları
                      </h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Yeni mesaj bildirimleri
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Arkadaş istekleri
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Hesap
                      </h3>
                      <button
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;