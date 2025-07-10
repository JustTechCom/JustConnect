// frontend/src/components/Chat/WelcomeScreen.tsx - Enhanced Modern Design
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  Sparkles, 
  Zap, 
  Heart, 
  Globe, 
  Shield, 
  Rocket,
  Coffee,
  Star,
  TrendingUp,
  Activity,
  Clock,
  UserPlus,
  Send,
  Image,
  Mic,
  Video,
  FileText
} from 'lucide-react';

interface WelcomeScreenProps {
  onNewChat: () => void;
  user: any;
  stats: {
    totalChats: number;
    unreadCount: number;
    activeUsers: number;
  };
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewChat, user, stats }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Set greeting based on time
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 6) setGreeting('İyi geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi günler');
    else setGreeting('İyi akşamlar');
  }, [currentTime]);

  // Generate floating elements
  useEffect(() => {
    const elements = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setFloatingElements(elements);
  }, []);

  const features = [
    {
      icon: MessageCircle,
      title: 'Anlık Mesajlaşma',
      description: 'Gerçek zamanlı mesaj gönderme ve alma',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Grup Sohbetleri',
      description: 'Takım arkadaşlarınızla grup halinde konuşun',
      color: 'green'
    },
    {
      icon: Image,
      title: 'Medya Paylaşımı',
      description: 'Fotoğraf, video ve dosya paylaşın',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Güvenli İletişim',
      description: 'End-to-end şifreleme ile güvenli mesajlaşma',
      color: 'red'
    },
    {
      icon: Mic,
      title: 'Sesli Mesajlar',
      description: 'Sesli mesaj kaydedin ve gönderin',
      color: 'yellow'
    },
    {
      icon: Video,
      title: 'Video Aramalar',
      description: 'HD kalitede video görüşmeler yapın',
      color: 'indigo'
    }
  ];

  const quickActions = [
    {
      icon: UserPlus,
      title: 'Kişi Ekle',
      description: 'Yeni arkadaşlar keşfedin',
      action: () => console.log('Add contact')
    },
    {
      icon: Users,
      title: 'Grup Oluştur',
      description: 'Yeni bir grup sohbeti başlatın',
      action: () => console.log('Create group')
    },
    {
      icon: Sparkles,
      title: 'AI Asistan',
      description: 'Yapay zeka ile sohbet edin',
      action: () => console.log('AI assistant')
    }
  ];

  const recentActivities = [
    { type: 'join', user: 'Ahmet', time: '2 dk önce', icon: UserPlus },
    { type: 'message', user: 'Ayşe', time: '5 dk önce', icon: MessageCircle },
    { type: 'group', user: 'Mehmet', time: '10 dk önce', icon: Users },
    { type: 'call', user: 'Fatma', time: '15 dk önce', icon: Video }
  ];

  return (
    <div className="relative h-full overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute w-2 h-2 bg-primary-300/20 rounded-full animate-float"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animationDelay: `${element.delay}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 max-w-6xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 animate-pulse-slow scale-150" />
            <div className="relative w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow-primary">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {greeting}
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              {user?.firstName}!
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            JustConnect ile modern mesajlaşma deneyimini yaşayın
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>{stats.activeUsers} aktif kullanıcı</span>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalChats}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Toplam Sohbet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aktif konuşmalarınız</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 animate-slide-in-bottom" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unreadCount}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Okunmamış</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yeni mesajlarınız</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 animate-slide-in-bottom" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Aktif Kullanıcı</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Şu anda çevrimiçi</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="w-full max-w-4xl mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Hızla Başlayın
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-soft hover:shadow-strong transition-all duration-300 hover:scale-105 hover:bg-white dark:hover:bg-gray-800 animate-slide-in-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Features showcase */}
        <div className="w-full max-w-6xl mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Özellikler
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              };

              return (
                <div
                  key={index}
                  className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 animate-slide-in-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 ${colorClasses[feature.color]} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Son Aktiviteler
          </h2>
          
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-soft">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in-right"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        <span className="font-semibold">{activity.user}</span> yeni bir aktivite gerçekleştirdi
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 animate-bounce-subtle">
          <button
            onClick={onNewChat}
            className="btn btn-primary text-lg px-8 py-4 hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5 mr-3" />
            İlk Sohbetinizi Başlatın
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 opacity-10 dark:opacity-5">
        <Sparkles className="w-32 h-32 text-primary-500 animate-spin-slow" />
      </div>
      
      <div className="absolute bottom-10 left-10 opacity-10 dark:opacity-5">
        <Rocket className="w-24 h-24 text-secondary-500 animate-bounce-gentle" />
      </div>
    </div>
  );
};

export default WelcomeScreen;