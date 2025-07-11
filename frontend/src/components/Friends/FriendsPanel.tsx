// frontend/src/components/Friends/FriendsPanel.tsx - Modern Friends System
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchFriends, 
  fetchFriendRequests, 
  sendFriendRequest, 
  respondToFriendRequest,
  removeFriend 
} from '../../store/slices/authSlice';
import { 
  Search, 
  UserPlus, 
  Users, 
  Clock, 
  Check, 
  X, 
  MessageCircle,
  MoreVertical,
  UserMinus,
  Shield,
  Heart,
  Sparkles,
  Crown,
  Star
} from 'lucide-react';

interface FriendsPanelProps {}

const FriendsPanel: React.FC<FriendsPanelProps> = () => {
  const dispatch = useDispatch();
  const { friends, friendRequests, isLoadingFriends } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    dispatch(fetchFriends() as any);
    dispatch(fetchFriendRequests() as any);
  }, [dispatch]);

  // Mock search function - replace with real API call
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockUsers = [
        {
          id: '1',
          username: 'john_doe',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
          isOnline: true,
          mutualFriends: 5,
          bio: 'Software Engineer at TechCorp'
        },
        {
          id: '2',
          username: 'jane_smith',
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: null,
          isOnline: false,
          mutualFriends: 12,
          bio: 'Designer & Creative Director'
        },
        {
          id: '3',
          username: 'alex_dev',
          firstName: 'Alex',
          lastName: 'Developer',
          avatar: null,
          isOnline: true,
          mutualFriends: 3,
          bio: 'Full Stack Developer'
        }
      ].filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.firstName.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockUsers);
      setIsSearching(false);
    }, 500);
  };

  const handleSendFriendRequest = (userId: string) => {
    dispatch(sendFriendRequest(userId) as any);
  };

  const handleRespondToRequest = (requestId: string, action: 'accept' | 'reject') => {
    dispatch(respondToFriendRequest({ friendshipId: requestId, action }) as any);
  };

  const handleRemoveFriend = (friendId: string) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      dispatch(removeFriend(friendId) as any);
    }
  };

  const getFriendshipStatus = (userId: string) => {
    const isFriend = friends.some(friend => friend.id === userId);
    const hasSentRequest = friendRequests.sent.some(req => req.receiverId === userId);
    const hasReceivedRequest = friendRequests.received.some(req => req.senderId === userId);
    
    if (isFriend) return 'friends';
    if (hasSentRequest) return 'sent';
    if (hasReceivedRequest) return 'received';
    return 'none';
  };

  const renderFriendCard = (friend: any, showActions = false) => (
    <div key={friend.id} className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.firstName}+${friend.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
            alt={friend.firstName}
            className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
          />
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800 ${
            friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          {friend.isPremium && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {friend.firstName} {friend.lastName}
            </h3>
            {friend.isVerified && (
              <Shield className="w-4 h-4 text-blue-500" />
            )}
            {friend.isBestFriend && (
              <Heart className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            @{friend.username}
          </p>
          {friend.bio && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
              {friend.bio}
            </p>
          )}
          {friend.mutualFriends && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {friend.mutualFriends} mutual friends
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
            title="Send Message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="relative group/menu">
              <button className="p-2 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Add to Best Friends</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Block User</span>
                </button>
                <button 
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Remove Friend</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSearchResult = (user: any) => {
    const status = getFriendshipStatus(user.id);
    
    return (
      <div key={user.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
              alt={user.firstName}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800 ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
            </p>
            {user.bio && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                {user.bio}
              </p>
            )}
            {user.mutualFriends > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {user.mutualFriends} mutual friends
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {status === 'friends' && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Friends</span>
              </span>
            )}
            {status === 'sent' && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Sent</span>
              </span>
            )}
            {status === 'none' && (
              <button
                onClick={() => handleSendFriendRequest(user.id)}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add Friend</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-300 text-sm font-medium ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-gray-700 shadow-lg text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
            {friends.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-300 text-sm font-medium ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-gray-700 shadow-lg text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Requests</span>
            {friendRequests.received.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {friendRequests.received.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-300 text-sm font-medium ${
              activeTab === 'search'
                ? 'bg-white dark:bg-gray-700 shadow-lg text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {activeTab === 'search' && (
        <div className="p-4 border-b border-white/20 dark:border-gray-700/20">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for friends by username, name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 backdrop-blur-sm text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : friends.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Friends ({friends.length})
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{friends.filter(f => f.isOnline).length} online</span>
                  </div>
                </div>
                {friends.map(friend => renderFriendCard(friend, true))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No friends yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start connecting with people by searching for them!
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn btn-primary"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends
                </button>
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {friendRequests.received.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Friend Requests ({friendRequests.received.length})
                </h3>
                {friendRequests.received.map((request: any) => (
                  <div key={request.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={request.sender.avatar || `https://ui-avatars.com/api/?name=${request.sender.firstName}+${request.sender.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                        alt={request.sender.firstName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {request.sender.firstName} {request.sender.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{request.sender.username}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRespondToRequest(request.id, 'accept')}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request.id, 'reject')}
                          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No friend requests
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any pending friend requests.
                </p>
              </div>
            )}
          </>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            {searchQuery && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Search Results for "{searchQuery}"
              </h3>
            )}
            
            {searchResults.length > 0 ? (
              searchResults.map(user => renderSearchResult(user))
            ) : searchQuery && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try searching with a different keyword.
                </p>
              </div>
            ) : !searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Discover New Friends
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Search for people by their username or name to connect with them.
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsPanel;