import React, { useState } from 'react';
import { Chat } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Users, 
  Info,
  Volume2,
  VolumeX,
  Pin,
  Archive,
  Trash2,
  Settings
} from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { onlineUsers, typingUsers } = useSelector((state: RootState) => state.chats);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);

  const isTyping = typingUsers[chat.id]?.length > 0;

  const getChatName = () => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'DIRECT' && chat.members && chat.members.length > 0) {
      const otherMember = chat.members[0];
      return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    if (chat.avatar) return chat.avatar;
    
    if (chat.type === 'DIRECT' && chat.members && chat.members.length > 0) {
      return chat.members[0].user.avatar || '/default-avatar.png';
    }
    
    return '/default-group-avatar.png';
  };

  const getStatusText = () => {
    if (isTyping) {
      const typingUsernames = typingUsers[chat.id]
        ?.map(userId => {
          const member = chat.members && chat.members.find(m => m.user.id === userId);
          return member?.user.firstName || 'Someone';
        })
        .join(', ');
      return `${typingUsernames} yazıyor...`;
    }

    if (chat.type === 'DIRECT' && chat.members && chat.members.length > 0) {
      const otherMember = chat.members[0];
      return onlineUsers.has(otherMember.user.id) ? 'Çevrimiçi' : 'Çevrimdışı';
    }

    if (chat.type === 'GROUP' && chat.members) {
      const onlineMembersCount = chat.members.filter(member => 
        onlineUsers.has(member.user.id)
      ).length;
      return `${chat.members.length} üye, ${onlineMembersCount} çevrimiçi`;
    }

    return '';
  };

  const isOnline = chat.type === 'DIRECT' && chat.members && chat.members.length > 0 
    ? onlineUsers.has(chat.members[0].user.id)
    : false;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Chat Info */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => setShowChatInfo(true)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={getChatAvatar()}
                alt={getChatName()}
                className="w-10 h-10 rounded-full object-cover"
              />
              
              {/* Online indicator for direct chats */}
              {chat.type === 'DIRECT' && isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
              )}
              
              {/* Group indicator */}
              {chat.type === 'GROUP' && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-2 h-2 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {getChatName()}
              </h2>
              
              <p className={`text-sm truncate ${
                isTyping 
                  ? 'text-blue-500 dark:text-blue-400 italic' 
                  : isOnline
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Voice Call */}
            {chat.type === 'DIRECT' && (
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
            )}

            {/* Video Call */}
            {chat.type === 'DIRECT' && (
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                <Video className="w-5 h-5" />
              </button>
            )}

            {/* Search */}
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* More Options */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
                  <button 
                    onClick={() => {
                      setShowChatInfo(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                  >
                    <Info className="w-4 h-4" />
                    <span>Sohbet Bilgileri</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <Pin className="w-4 h-4" />
                    <span>Sabitle</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <VolumeX className="w-4 h-4" />
                    <span>Sessiz</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <Archive className="w-4 h-4" />
                    <span>Arşivle</span>
                  </button>
                  
                  {chat.type === 'GROUP' && (
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                      <Settings className="w-4 h-4" />
                      <span>Grup Ayarları</span>
                    </button>
                  )}
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <Trash2 className="w-4 h-4" />
                      <span>Sohbeti Sil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Info Modal */}
      {showChatInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sohbet Bilgileri
              </h3>
              <button
                onClick={() => setShowChatInfo(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="text-center mb-6">
                <img
                  src={getChatAvatar()}
                  alt={getChatName()}
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getChatName()}
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  {getStatusText()}
                </p>
              </div>

              {/* Chat Members */}
              {chat.type === 'GROUP' && chat.members && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Üyeler ({chat.members.length})
                  </h5>
                  <div className="space-y-2">
                    {chat.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={member.user.avatar || '/default-avatar.png'}
                            alt={member.user.firstName}
                            className="w-8 h-8 rounded-full"
                          />
                          {onlineUsers.has(member.user.id) && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{member.user.username}
                          </p>
                        </div>
                        {member.role === 'ADMIN' && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;