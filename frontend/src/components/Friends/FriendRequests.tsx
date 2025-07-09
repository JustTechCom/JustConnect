// frontend/src/components/Friends/FriendRequests.tsx - Friend request management
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchFriendRequests, 
  respondToFriendRequest 
} from '../../store/slices/authSlice';
import { userAPI } from '../../services/api';
import { 
  X, 
  Check, 
  UserPlus, 
  Clock, 
  Users, 
  Loader,
  MessageCircle,
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';

interface FriendRequestsProps {
  onClose: () => void;
  onCreateChat?: (userId: string) => void;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({ onClose, onCreateChat }) => {
  const dispatch = useDispatch();
  const { friendRequests, isLoadingFriends } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [respondingTo, setRespondingTo] = useState<Set<string>>(new Set());
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchFriendRequests() as any);
  }, [dispatch]);

  const handleRespondToRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
    setRespondingTo(prev => new Set(prev).add(friendshipId));
    
    try {
      await dispatch(respondToFriendRequest({ friendshipId, action }) as any);
      
      // Refresh the list
      setTimeout(() => {
        dispatch(fetchFriendRequests() as any);
      }, 500);
    } catch (error) {
      console.error(`Failed to ${action} friend request:`, error);
    } finally {
      setRespondingTo(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const handleViewProfile = (userId: string) => {
    // This would open a user profile modal
    console.log('View profile:', userId);
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return then.toLocaleDateString();
    }
  };

  const renderFriendRequest = (request: any) => {
    const isReceived = activeTab === 'received';
    const user = isReceived ? request.requester : request.addressee;
    const isLoading = respondingTo.has(request.id);
    const isExpanded = expandedRequest === request.id;

    return (
      <div 
        key={request.id}
        className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </h3>
                  {user.isOnline && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                      Online
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(request.createdAt)}
                  </span>
                  {isReceived && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      wants to be friends
                    </span>
                  )}
                  {!isReceived && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      request sent
                    </span>
                  )}
                </div>

                {/* Bio preview */}
                {user.bio && !isExpanded && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {user.bio}
                  </p>
                )}

                {/* Expanded info */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {user.bio && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          About
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.bio}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Joined</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last seen</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.isOnline ? 'Now' : formatTimeAgo(user.lastSeen)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-3">
                {/* View/Expand button */}
                <button
                  onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title={isExpanded ? 'Collapse' : 'View details'}
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Message button (for accepted friends or when declining) */}
                {onCreateChat && (
                  <button
                    onClick={() => onCreateChat(user.id)}
                    className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Send message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                {/* Accept/Reject buttons for received requests */}
                {isReceived && (
                  <>
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'accept')}
                      disabled={isLoading}
                      className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Accept friend request"
                    >
                      {isLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'reject')}
                      disabled={isLoading}
                      className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reject friend request"
                    >
                      {isLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}

                {/* Cancel button for sent requests */}
                {!isReceived && (
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'reject')}
                    disabled={isLoading}
                    className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancel friend request"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const receivedRequests = friendRequests.received || [];
  const sentRequests = friendRequests.sent || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Friend Requests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your friend connections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Received ({receivedRequests.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Sent ({sentRequests.length})</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingFriends ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Loading friend requests...</p>
            </div>
          ) : (
            <>
              {activeTab === 'received' && (
                <div>
                  {receivedRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No friend requests
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        When someone sends you a friend request, it will appear here.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {receivedRequests.map(renderFriendRequest)}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sent' && (
                <div>
                  {sentRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No pending requests
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Friend requests you send will be shown here while waiting for a response.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {sentRequests.map(renderFriendRequest)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>🔒 All friend requests are private and secure</span>
            <button 
              onClick={() => dispatch(fetchFriendRequests() as any)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;