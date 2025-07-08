import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';

export const setupNotifications = async () => {
  // Request permission for iOS
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  // Request permission for Android
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Android notification permission granted');
    }
  }

  // Configure PushNotification
  PushNotification.configure({
    onRegister: function (token) {
      console.log('TOKEN:', token);
    },

    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
    },

    onAction: function (notification) {
      console.log('ACTION:', notification.action);
      console.log('NOTIFICATION:', notification);
    },

    onRegistrationError: function(err) {
      console.error(err.message, err);
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: true,
  });

  // Get FCM token
  try {
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    // Send this token to your server
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }

  // Handle background messages
  messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    
    // Show local notification
    PushNotification.localNotification({
      channelId: 'justconnect-channel',
      title: remoteMessage.notification?.title || 'New Message',
      message: remoteMessage.notification?.body || 'You have a new message',
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
    });
  });

  // Handle notification when app is in background/quit
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification,
    );
  });

  // Handle notification when app is launched from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'justconnect-channel',
        channelName: 'JustConnect Notifications',
        channelDescription: 'Notifications for JustConnect app',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }
};

export const showLocalNotification = (title: string, message: string, data?: any) => {
  PushNotification.localNotification({
    channelId: 'justconnect-channel',
    title,
    message,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    vibrate: true,
    userInfo: data,
  });
};

export const subscribeToTopic = (topic: string) => {
  messaging()
    .subscribeToTopic(topic)
    .then(() => console.log(`Subscribed to topic: ${topic}`))
    .catch(error => console.error(`Error subscribing to topic ${topic}:`, error));
};

export const unsubscribeFromTopic = (topic: string) => {
  messaging()
    .unsubscribeFromTopic(topic)
    .then(() => console.log(`Unsubscribed from topic: ${topic}`))
    .catch(error => console.error(`Error unsubscribing from topic ${topic}:`, error));
};