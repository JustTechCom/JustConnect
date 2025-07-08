import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { userAPI } from '../../services/api';
import { Search, X, UserPlus, Loader } from 'lucide-react';
import { useDebounce } from '../../hooks';

interface UserSearchProps {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await userAPI.searchUsers(debouncedSearchQuery);
        setSearchResults(response.data.users);
      } catch (error) {
        setError('Kullanıcı arama sırasında bir hata oluştu');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);

  const handleUserSelect = (user: User) => {
    onSelectUser(user);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Yeni Sohbet Başlat
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Kullanıcı adı, e-posta veya isim ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto">
          {!searchQuery ? (
            <div className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Sohbet başlatmak için kullanıcı arayın
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Aranıyor...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 dark:text-red-400 mb-2">⚠️</div>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">🔍</div>
              <p className="text-gray-500 dark:text-gray-400">
                "{searchQuery}" için sonuç bulunamadı
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                    )}
                  </div>

                  <div className="flex-1 ml-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {user.isOnline && (
                          <span className="text-xs text-green-500 font-medium">
                            Çevrimiçi
                          </span>
                        )}
                        <UserPlus className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Bir kullanıcı seçerek direkt sohbet başlatabilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;