// frontend/src/services/socketService.ts - Render için güncellenmiş connect fonksiyonu

connect(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (this.socket?.connected) {
      resolve();
      return;
    }

    if (this.isConnecting) {
      this.connectionCallbacks.push(resolve);
      return;
    }

    this.isConnecting = true;
    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'https://justconnect-o8k8.onrender.com';

    console.log('🔧 Connecting to server:', serverUrl);

    // Render için özel ayarlar
    this.socket = io(serverUrl, {
      auth: { token },
      // Render için kritik: Polling önce!
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false, // Render'da false olmalı
      timeout: 45000, // Render için daha uzun timeout
      forceNew: true,
      // Render specific ayarları
      path: '/socket.io',
      autoConnect: true,
      randomizationFactor: 0.5,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      // Engine.io ayarları
      closeOnBeforeunload: true
    });

    this.setupEventListeners();

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server successfully');
      console.log('🚀 Transport:', this.socket?.io.engine.transport.name);
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Join user's chats
      this.socket?.emit('join_chats');
      
      // Notify success
      store.dispatch(addNotification({
        type: 'success',
        title: 'Bağlandı',
        message: 'JustConnect sunucusuna başarıyla bağlandı',
      }));

      // Execute callbacks
      this.connectionCallbacks.forEach(callback => callback());
      this.connectionCallbacks = [];
      
      resolve();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      console.log('🔧 Trying different transport...');
      
      this.isConnecting = false;
      
      // Render için özel retry mantığı
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      } else {
        console.error('❌ Max reconnection attempts reached');
        store.dispatch(addNotification({
          type: 'error',
          title: 'Bağlantı Hatası',
          message: 'Sunucuya bağlanılamadı. Sayfayı yenilemeyi deneyin.',
        }));
        reject(error);
      }
    });

    // Transport upgrade monitoring
    this.socket.on('upgrade', () => {
      console.log('⬆️ Upgraded to:', this.socket?.io.engine.transport.name);
    });

    this.socket.on('upgradeError', (error) => {
      console.log('❌ Upgrade failed:', error);
    });
  });
}

private handleReconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.log('❌ Max reconnection attempts reached');
    return;
  }

  this.reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
  
  console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
  
  setTimeout(() => {
    if (this.socket && !this.socket.connected) {
      console.log('🔌 Attempting reconnection...');
      this.socket.connect();
    }
  }, delay);
}