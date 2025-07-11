import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface TypingIndicatorProps {
  chatId: string;
  typingUserIds: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ chatId, typingUserIds }) => {
  const { chats } = useSelector((state: RootState) => state.chats);
  
  const activeChat = chats.find(chat => chat.id === chatId);
  
  if (!activeChat || !activeChat.members || typingUserIds.length === 0) {
    return null;
  }

  const typingUsers = typingUserIds
    .map(userId => {
      const member = activeChat.members && activeChat.members.find(m => m.user.id === userId);
      return member?.user;
    })
    .filter(Boolean);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]?.firstName} yazıyor...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]?.firstName} ve ${typingUsers[1]?.firstName} yazıyor...`;
    } else {
      return `${typingUsers.length} kişi yazıyor...`;
    }
  };

  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <div className="flex-shrink-0">
        {typingUsers.length === 1 ? (
          <img
            src={typingUsers[0]?.avatar || '/default-avatar.png'}
            alt={typingUsers[0]?.firstName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {typingUsers.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {getTypingText()}
            </span>
            <div className="typing-indicator ml-2">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;