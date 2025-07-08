import React, { useEffect } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
import Toast from 'react-native-toast-message';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { setupNotifications } from './src/services/notificationService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Animated: `useNativeDriver`',
]);

const App: React.FC = () => {
  useEffect(() => {
    // Hide splash screen
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 2000);

    // Setup push notifications
    setupNotifications();

    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <NavigationContainer>
          <StatusBar
            barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
            backgroundColor="#3B82F6"
            translucent={Platform.OS === 'android'}
          />
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default App;