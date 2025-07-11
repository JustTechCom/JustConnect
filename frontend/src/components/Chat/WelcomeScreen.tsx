// frontend/src/components/Chat/WelcomeScreen.tsx - Modern Welcome Screen
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  MessageCircle, 
  Users, 
  Zap, 
  Shield, 
  Heart,
  Sparkles,
  ArrowRight,
  Send,
  Smile,
  Camera,
  Mic,
  File,
  Crown,
  Star,
  Globe,
  Lock,
  Rocket
} from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Send messages instantly with real-time delivery",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "End-to-End Encryption",
      description: "Your conversations are secure and private",
      color: "from-green-400 to-blue-500"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Rich Media Support",
      description: "Share photos, videos, files and more",
      color: "from-pink-400 to-red-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Group Conversations",
      description: "Connect with multiple people at once",
      color: "from-purple-400 to-indigo-500"
    }
  ];

  const quickActions = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Find Friends",
      description: "Discover new connections",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "New Chat",
      description: "Start a conversation",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Crown className="w-5 h-5" />,
      label: "Create Group",
      description: "Start a group chat",
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: "Join Channel",
      description: "Join public discussions",
      color: "from-pink-500 to-rose-600"
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-pink-400/20 to-red-500/20 rounded-full filter blur-3xl animate-float animation-delay-2000" />
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-full filter blur-3xl animate-float animation-delay-4000" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {getGreeting()}, {user?.firstName}!
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Welcome to <span className="font-semibold text-blue-600 dark:text-blue-400">JustConnect</span> - 
                where conversations come alive with modern messaging
              </p>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="mb-12">
            <div className="relative">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        index === currentFeature
                          ? 'bg-blue-500 w-8'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="transition-all duration-500 transform">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${features[currentFeature].color} text-white mb-4 shadow-lg`}>
                    {features[currentFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {features[currentFeature].description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-xl hover:scale-105"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Composition Demo */}
          <div className="mb-12">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Rich Message Composer
              </h3>
              
              <div className="bg-white/80 dark:bg-gray-700/80 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=ffffff&rounded=true&bold=true`}
                    alt="You"
                    className="w-8 h-8 rounded-lg"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    You
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    placeholder="Type your message here... 😊"
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-500"
                    rows={3}
                    disabled
                  />
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        <Smile className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        <File className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4">
                <Rocket className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">256-bit</div>
              <div className="text-gray-600 dark:text-gray-300">Encryption</div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white mb-4">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">5.0</div>
              <div className="text-gray-600 dark:text-gray-300">User Rating</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Select a chat from the sidebar or start a new conversation to begin messaging
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <Users className="w-5 h-5" />
                <span>Find Friends</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button className="flex items-center space-x-2 px-6 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;