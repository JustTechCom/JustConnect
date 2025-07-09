// frontend/src/components/Sidebar/UserSearch.tsx - Enhanced user search with friend system
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { User } from '../../types';
import { searchUsers } from '../../store/slices/chatSlice';
import { sendFriendRequest, createDirectChat } from '../../store/slices/chatSlice';
import { userAPI } from '../../services/api';
import { Search, X, UserPlus, Loader, MessageCircle, Check, Clock, UserCheck } from 'lucide-react';
import { useDebounce } from '../../hooks';

interface UserSearchProps {
  onClose: () => void;
  onSelectUser?: (user: User) => void;
  mode?: 'chat' | 'friend' | 'both'; // Different modes for different purposes
}

const UserSearch: React.FC<UserSearchProps> = ({ 
  onClose, 
  onSelectUser,
  mode = 'both' 
}) => {
  const dispatch = useDispatch();
  const { searchResults, isSearching } = useSelector((state: RootState) => state.chats);
  const { friends, friendRequests } = useSelector((state: RootState) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<User[]>([]);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [creatingChats, setCreatingChats] = useState<Set<string>>(new Set());

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      dispatch(searchUsers(debouncedSearchQuery) as any);
    }
  }, [debouncedSearchQuery, dispatch]);

  useEffect(() => {
    // Filter results based on mode and existing relationships
    let filtered = searchResults;

    if (mode === 'friend') {
      // Only show users who are not already friends
      filtered = searchResults.filter(user => 
        !friends.some(friend => friend.id === user.id) &&
        !friendRequests.sent.some(req => req.addresseeId === user.id) &&
        !friendRequests.received.some(req => req.requesterId === user.id)
      );
    }

    setFilteredResults(filtered);
  }, [searchResults, friends, friendRequests, mode]);

  const getFriendshipStatus = (userId: string) => {
    if (friends.some(friend => friend.id === userId)) {
      return 'friend';
    }
    if (friendRequests.sent.some(req => req.addresseeId === userId)) {
      return 'sent';
    }
    if (friendRequests.received.some(req => req.requesterId === userId)) {
      return 'received';
    }
    return 'none';
  };

  const handleSendFriendRequest = async (userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    
    try {
      await userAPI.sendFriendRequest(userId);
      // The socket will handle the real-time update
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleCreateChat = async (user: User) => {
    setCreatingChats(prev => new Set(prev).add(user.id));
    
    try {
      const resultAction = await dispatch(createDirectChat(user.id) as any);
      if (resultAction.type.endsWith('/fulfilled')) {
        onClose();
        onSelectUser?.(user);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setCreatingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const renderUserActions = (user: User) => {
    const friendshipStatus = getFriendshipStatus(user.id);
    const isLoadingSend = sendingRequests.has(user.id);
    const isLoadingChat = creatingChats.has(user.id);

    return (
      <div className="flex items-center space-x-2">
        {/* Chat button - always available */}
        {(mode === 'chat' || mode === 'both') && (
          <button
            onClick={() => handleCreateChat(user)}
            disabled={isLoadingChat}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start chat"
          >
            {isLoadingChat ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Friend request button - context dependent */}
        {(mode === 'friend' || mode === 'both') && (
          <>
            {friendshipStatus === 'none' && (
              <button
                onClick={() => handleSendFriendRequest(user.id)}
                disabled={isLoadingSend}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send friend request"
              >
                {isLoadingSend ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </button>
            )}

            {friendshipStatus === 'sent' && (
              <div className="flex items-center px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">Pending</span>
              </div>
            )}

            {friendshipStatus === 'received' && (
              <div className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg">
                <UserPlus className="w-4 h-4 mr-1" />
                <span className="text-sm">Wants to be friends</span>
              </div>
            )}

            {friendshipStatus === 'friend' && (
              <div className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                <UserCheck className="w-4 h-4 mr-1" />
                <span className="text-sm">Friend</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getResultsEmptyMessage = () => {
    if (!searchQuery.trim()) {
      return {
        icon: '🔍',
        title: 'Search for users',
        description: mode === 'friend' 
          ? 'Find new friends by searching their username, email, or name'
          : 'Start a conversation by finding users'
      };
    }

    if (isSearching) {
      return null; // Show loading state instead
    }

    if (searchResults.length === 0) {
      return {
        icon: '🤷‍♂️',
        title: 'No users found',
        description: `No users found matching "${searchQuery}"`
      };
    }

    if (filteredResults.length === 0) {
      return {
        icon: '✅',
        title: 'No new users',
        description: mode === 'friend' 
          ? 'All found users are already your friends or have pending requests'
          : 'All found users are already in your contacts'
      };
    }

    return null;
  };

  const emptyMessage = getResultsEmptyMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'friend' 
              ? 'Find Friends' 
              : mode === 'chat' 
                ? 'Start New Chat' 
                : 'Find Users'
            }
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
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          {/* Search hints */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Try searching for usernames like "john_doe" or names like "John Smith"
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto">
          {emptyMessage ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">{emptyMessage.icon}</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {emptyMessage.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {emptyMessage.description}
              </p>
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Searching users...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                      )}
                      {user.verified && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.isOnline && (
                          <span className="text-xs text-green-500 font-medium">
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {renderUserActions(user)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {mode === 'friend' 
              ? '🔒 Friend requests are private and secure'
              : '💬 Start meaningful conversations with new people'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;