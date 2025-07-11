// frontend/src/pages/Profile.tsx - User Profile Page
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { 
  Camera, 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Crown,
  Star,
  Settings,
  Lock,
  Bell,
  Palette,
  Globe,
  LogOut
} from 'lucide-react';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.ui);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const handleSave = () => {
    dispatch(updateUser(formData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      email: user?.email || '',
      username: user?.username || '',
    });
    setIsEditing(false);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 mb-8">
            <div className="relative p-8">
              {/* Cover Photo */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-10" />
              
              <div className="relative flex items-center space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true&size=120`}
                    alt={user?.firstName}
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-gray-700 shadow-2xl"
                  />
                  
                  {/* Upload button */}
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg">
                    <Camera className="w-5 h-5" />
                  </button>
                  
                  {/* Status badges */}
                  <div className="absolute -top-2 -right-2 flex space-x-1">
                    <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {user?.firstName} {user?.lastName}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 mb-1">
                        @{user?.username}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {formatDate(user?.createdAt || new Date())}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                  
                  {/* Bio */}
                  <div className="mt-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      {user?.bio || 'No bio yet. Add a bio to tell others about yourself!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Details */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{user?.firstName}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{user?.lastName}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{user?.email}</span>
                      <div className="ml-auto">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-gray-400">@</span>
                      <span className="text-gray-900 dark:text-white">{user?.username}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Tell others about yourself..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-gray-900 dark:text-white">
                          {user?.bio || 'No bio yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Account Settings */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Settings
                </h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-colors">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Privacy & Security</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-colors">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Notifications</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-colors">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Appearance</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-colors">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Language</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Activity Stats
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Messages Sent</span>
                    <span className="font-semibold text-gray-900 dark:text-white">1,234</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Friends</span>
                    <span className="font-semibold text-gray-900 dark:text-white">42</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Groups</span>
                    <span className="font-semibold text-gray-900 dark:text-white">8</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Files Shared</span>
                    <span className="font-semibold text-gray-900 dark:text-white">156</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200/50 dark:border-red-700/50 p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                  Danger Zone
                </h3>
                
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;