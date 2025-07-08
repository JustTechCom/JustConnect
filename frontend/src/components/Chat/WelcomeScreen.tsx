import React from 'react';
import { MessageCircle, Users, Shield, Zap, Heart } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          JustConnect'e Hoş Geldiniz
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Arkadaşlarınızla bağlantı kurun, gerçek zamanlı sohbet edin ve 
          her anınızı paylaşın. Güvenli ve hızlı mesajlaşma deneyimi için 
          sol taraftan bir sohbet seçin.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Anında Mesajlaşma
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerçek zamanlı mesaj gönderimi
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Güvenli
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              End-to-end şifreleme
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Grup Sohbetleri
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Çoklu kişi sohbetleri
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Kullanıcı Dostu
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sezgisel arayüz tasarımı
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Yeni Sohbet Başlat
          </button>
          
          <div className="flex space-x-4">
            <button className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Grup Oluştur
            </button>
            <button className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Kişi Ekle
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>İpucu:</strong> Hızlı erişim için klavye kısayollarını kullanabilirsiniz. 
            <kbd className="mx-1 px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl+N</kbd> 
            ile yeni sohbet başlatın.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          <p>
            🔒 Güvenli • 🚀 Hızlı • 💬 Gerçek Zamanlı
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;