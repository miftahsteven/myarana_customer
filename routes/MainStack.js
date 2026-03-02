import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppStack from './AppStack';
import Profile from '../app/screens/Service/Profile';
import ForgotPassword from '../app/screens/Service/ForgotPassword';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* MainTabs includes Dashboard, MyPackage, Product, Chat and the bottom tab bar */}
      <Stack.Screen name="MainTabs" component={AppStack} />
      
      {/* Profile screen sits outside the tab bar, so tabs are hidden when viewing it */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

export default MainStack;
