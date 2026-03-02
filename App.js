import React, { useEffect } from 'react';
import Routes from './routes';
import { AuthProvider } from './context/AuthContext';
import { usePushNotifications } from './hooks/usePushNotifications';

export default function App() {
  const { expoPushToken, devicePushToken } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      console.log('Main App.js - Expo Push Token:', expoPushToken);
    }
    if (devicePushToken) {
      console.log('Main App.js - Device Push Token:', devicePushToken);
    }
  }, [expoPushToken, devicePushToken]);

  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
