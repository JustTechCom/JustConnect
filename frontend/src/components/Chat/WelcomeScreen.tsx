// frontend/src/components/Chat/WelcomeScreen.tsx - Modern Professional Design

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  MessageCircle, 
  Users, 
  Video, 
  Shield, 
  Zap, 
  Globe, 
  Plus,
  Search,
  Settings,
  Star,
  Clock,
  Send,
  Heart,
  Sparkles
} from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { chats } = useSelector((state: RootState) => state.chats);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Real-time messaging with instant delivery",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "End-to-End Encrypted",
      description: "Your conversations are private and secure",
      gradient: "from-green-400 to-blue-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Group Chats",
      description: "Connect with teams and communities",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Voice & Video",
      description: "High-quality calls with anyone, anywhere",
      gradient: "from-blue-400 to-indigo-500"
    }
  ];

  const quickActions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: "New Chat",
      description: "Start a conversation",
      color: "text-indigo-600"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Create Group",
      description: "Add multiple people",
      color: "text-purple-600"
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Find People",
      description: "Search by username",
      color: "text-blue-600"
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      description: "Customize your experience",
      color: "text-gray-600"
    }
  ];

  const stats = [
    { label: "Conversations", value: chats.length, icon: <MessageCircle className="w-4 h-4" /> },
    { label: "Contacts", value: "24", icon: <Users className="w-4 h-4" /> },
    { label: "Files Shared", value: "156", icon: <Send className="w-4 h-4" /> },
    { label: "Time Saved", value: "2.5h", icon: <Clock className="w-4 h-4" /> }
  ];

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/20 via-transparent to-purple-100/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {greeting}, {user?.firstName}!
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Welcome to <span className="font-semibold text-indigo-600 dark:text-indigo-400">JustConnect</span>
            </p>
            
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Your professional messaging platform for seamless communication
            </p>
          </div>

          {/* Personal Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass-card-sm p-4 text-center animate-slide-up hover:scale-105 transition-transform duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="w-full max-w-2xl mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              What would you like to do?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Get started with these quick actions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                className="glass-card-sm p-6 text-left hover:scale-105 transition-all duration-200 group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color === 'text-indigo-600' ? 'from-indigo-500 to-purple-600' : action.color === 'text-purple-600' ? 'from-purple-500 to-pink-600' : action.color === 'text-blue-600' ? 'from-blue-500 to-indigo-600' : 'from-gray-500 to-gray-600'} text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {action.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Why choose JustConnect?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Powerful features for modern communication
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="glass-card-sm p-6 text-center hover:scale-105 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 animate-slide-up">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Ready to start chatting?</span>
            <Heart className="w-4 h-4" />
          </div>
          
          <button className="btn-primary px-8 py-3 text-lg font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            Start Your First Conversation
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;