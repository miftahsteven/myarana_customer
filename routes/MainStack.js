import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppStack from './AppStack';
import Profile from '../app/screens/Service/Profile';
import ForgotPassword from '../app/screens/Service/ForgotPassword';
import SpeedTest from '../app/screens/Service/SpeedTest';
import NotificationsInbox from '../app/screens/Service/NotificationsInbox';
import SnapPayment from '../app/screens/Service/SnapPayment';
import AddService from '../app/screens/Service/AddService';
import HistoryTransactions from '../app/screens/Service/HistoryTransactions';
import MyInvoices from '../app/screens/Service/MyInvoices';
import Informations from '../app/screens/Service/Informations';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* MainTabs includes Dashboard, MyPackage, Product, Chat and the bottom tab bar */}
      <Stack.Screen name="MainTabs" component={AppStack} />
      
      {/* Profile screen sits outside the tab bar, so tabs are hidden when viewing it */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="SpeedTest" component={SpeedTest} />
      <Stack.Screen name="NotificationsInbox" component={NotificationsInbox} />
      <Stack.Screen name="SnapPayment" component={SnapPayment} />
      <Stack.Screen name="AddService" component={AddService} />
      <Stack.Screen name="HistoryTransactions" component={HistoryTransactions} />
      <Stack.Screen name="MyInvoices" component={MyInvoices} />
      <Stack.Screen name="Informations" component={Informations} />
    </Stack.Navigator>
  );
};

export default MainStack;
