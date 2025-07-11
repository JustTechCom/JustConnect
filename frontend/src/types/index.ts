// frontend/src/types/index.ts - Complete Type Definitions
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  isPremium?: boolean;
  isBestFriend?: boolean;
  mutualFriends?: number;
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION';
  chatId: string;
  senderId: string;
  replyTo?: string;
  edited: boolean;
  delivered: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  replyToMessage?: Message;
  isOwn?: boolean;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  avatar?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastMessage?: string | Message;
  lastMessageAt?: Date;
  members: ChatMember[];
  messageCount: number;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isVerified?: boolean;
  isTyping?: boolean;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  messageId: string;
  uploadedAt: Date;
}

export interface TypingUser {
  userId: string;
  username: string;
  chatId: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ChatCreationData {
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  memberIds: string[];
  name?: string;
  description?: string;
}

export interface MessageData {
  chatId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION';
  replyTo?: string;
}

export interface SearchResult {
  users: User[];
  chats: Chat[];
  messages: Message[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Socket.io event types
export interface SocketEvents {
  // Client to Server
  join_chats: () => void;
  send_message: (data: MessageData) => void;
  typing_start: (data: { chatId: string }) => void;
  typing_stop: (data: { chatId: string }) => void;
  message_delivered: (data: { messageId: string; chatId: string }) => void;
  message_read: (data: { messageId: string; chatId: string }) => void;
  
  // Server to Client
  new_message: (message: Message) => void;
  user_typing: (data: { userId: string; chatId: string }) => void;
  user_stopped_typing: (data: { userId: string; chatId: string }) => void;
  message_status_updated: (data: { messageId: string; status: string }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  error: (data: { message: string }) => void;
}

// Component prop types
export interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTime: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export interface UserItemProps {
  user: User;
  isOnline?: boolean;
  showStatus?: boolean;
  onClick?: () => void;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: File;
}

export interface SettingsFormData {
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    readReceipts: boolean;
    lastSeen: boolean;
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
  };
  theme: {
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    language: string;
  };
}

// Friendship types
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  sender: User;
  receiver: User;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: Date;
  updatedAt: Date;
  user1: User;
  user2: User;
}