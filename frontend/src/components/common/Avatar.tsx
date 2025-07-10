// frontend/src/components/common/Avatar.tsx
import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name = '', 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-32 h-32 text-2xl'
  };

  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling;
    if (fallback) {
      (fallback as HTMLElement).style.display = 'flex';
    }
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      {src && (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={handleImageError}
        />
      )}
      
      {/* Fallback avatar */}
      <div
        className={`
          ${sizeClasses[size]} rounded-full 
          ${getAvatarColor(name)} 
          flex items-center justify-center 
          text-white font-semibold
          ${src ? 'hidden' : 'flex'}
        `}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
      </div>
    </div>
  );
};

export default Avatar;

// frontend/src/components/common/GroupAvatar.tsx
import React from 'react';
import { Users } from 'lucide-react';

interface GroupAvatarProps {
  src?: string | null;
  name?: string;
  memberCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const GroupAvatar: React.FC<GroupAvatarProps> = ({ 
  src, 
  name = 'Group', 
  memberCount = 0,
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-32 h-32 text-2xl'
  };

  const getInitials = (groupName: string) => {
    const words = groupName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return groupName.slice(0, 2).toUpperCase();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling;
    if (fallback) {
      (fallback as HTMLElement).style.display = 'flex';
    }
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      {src && (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={handleImageError}
        />
      )}
      
      {/* Fallback group avatar */}
      <div
        className={`
          ${sizeClasses[size]} rounded-full 
          bg-gradient-to-br from-blue-500 to-purple-600
          flex items-center justify-center 
          text-white font-semibold
          ${src ? 'hidden' : 'flex'}
        `}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {name && name !== 'Group' ? (
          getInitials(name)
        ) : (
          <Users className="w-1/2 h-1/2" />
        )}
      </div>
    </div>
  );
};

export default GroupAvatar;

// Usage Examples:

// In Profile.tsx, replace the img tag with:
// <Avatar 
//   src={avatarPreview || user.avatar} 
//   name={`${user.firstName} ${user.lastName}`} 
//   size="xl"
//   className="ring-4 ring-white dark:ring-gray-800 shadow-lg"
// />

// In ChatHeader.tsx, replace the avatar logic with:
// {chat.type === 'DIRECT' ? (
//   <Avatar 
//     src={getChatAvatar()} 
//     name={getChatName()} 
//     size="md"
//   />
// ) : (
//   <GroupAvatar 
//     src={chat.avatar} 
//     name={chat.name} 
//     memberCount={chat.members.length}
//     size="md"
//   />
// )}