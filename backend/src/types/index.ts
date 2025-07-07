import { Request } from 'express';

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
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}