import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set handler how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [devicePushToken, setDevicePushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((tokens) => {
      if (tokens) {
        setExpoPushToken(tokens.expoToken);
        setDevicePushToken(tokens.deviceToken);
      }
    });

    // Listener for when notification is received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received in foreground:', notification);
    });

    // Listener for when user taps or interacts with the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, devicePushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let expoToken = '';
  let deviceToken = '';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
         console.warn("Project ID is missing. Expo Push Token may not be generated properly.");
      }

      // Get Expo Push Token for Expo API
      const expoTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      expoToken = expoTokenResponse.data;
      console.log("Expo Push Token:", expoToken);

      // Get native Device Push Token for direct Firebase/APNs
      const deviceTokenResponse = await Notifications.getDevicePushTokenAsync();
      deviceToken = deviceTokenResponse.data;
      console.log("Device Push Token (FCM/APNs):", deviceToken);

    } catch (e) {
      console.error('Error fetching push tokens:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return { expoToken, deviceToken };
}
