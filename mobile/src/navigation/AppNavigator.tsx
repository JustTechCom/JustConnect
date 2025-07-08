import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#3B82F6' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ title: 'Giriş Yap' }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{ title: 'Kayıt Ol' }}
    />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#3B82F6' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="ChatList" 
      component={ChatListScreen} 
      options={{ title: 'Sohbetler' }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={({ route }) => ({ 
        title: route.params?.chatName || 'Sohbet' 
      })}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Chats') {
          iconName = 'chat';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        } else if (route.name === 'Settings') {
          iconName = 'settings';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Chats" 
      component={ChatStack} 
      options={{ title: 'Sohbetler' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Profil' }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ title: 'Ayarlar' }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;