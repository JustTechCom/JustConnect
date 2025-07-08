// Date and time utilities
export const formatTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  return messageDate.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const formatDate = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return 'Bugün';
  } else if (diffInHours < 48) {
    return 'Dün';
  } else if (diffInHours < 24 * 7) {
    return messageDate.toLocaleDateString('tr-TR', { weekday: 'long' });
  } else {
    return messageDate.toLocaleDateString('tr-TR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

export const formatRelativeTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return 'Şimdi';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} dakika önce`;
  } else if (diffInMinutes < 60 * 24) {
    return `${Math.floor(diffInMinutes / 60)} saat önce`;
  } else {
    return formatDate(messageDate);
  }
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const highlightText = (text: string, query: string): string => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const extractLinks = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const replaceLinkWithClickable = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const getFileIcon = (filename: string): string => {
  const extension = getFileExtension(filename).toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📋';
    case 'zip':
    case 'rar':
      return '🗜️';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return '🎵';
    case 'mp4':
    case 'avi':
    case 'mov':
      return '🎬';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️';
    default:
      return '📎';
  }
};

export const isImageFile = (filename: string): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
};

export const isVideoFile = (filename: string): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension);
};

export const isAudioFile = (filename: string): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension);
};

// Color utilities
export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (firstName: string, lastName?: string): string => {
  if (lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
  return firstName.charAt(0).toUpperCase();
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return strength;
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// DOM utilities
export const scrollToBottom = (element: HTMLElement): void => {
  element.scrollTop = element.scrollHeight;
};

export const smoothScrollToBottom = (element: HTMLElement): void => {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: 'smooth'
  });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Theme utilities
export const applyTheme = (isDark: boolean): void => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const getSystemTheme = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Notification utilities
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};

export const showNotification = (title: string, options?: NotificationOptions): Notification | null => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/badge-icon.png',
      tag: 'justconnect',
      renotify: false,
      ...options
    });
  }
  return null;
};

// Device utilities
export const isMobile = (): boolean => {
  return window.innerWidth <= 768;
};

export const isTablet = (): boolean => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = (): boolean => {
  return window.innerWidth > 1024;
};

export const vibrate = (pattern: number | number[]): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Search utilities
export const fuzzySearch = (query: string, text: string): boolean => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
};

export const highlightSearchQuery = (text: string, query: string): string => {
  if (!query) return text;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>');
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Constants
export const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TYPING_TIMEOUT: 3000,
  RETRY_ATTEMPTS: 3,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg'],
} as const;