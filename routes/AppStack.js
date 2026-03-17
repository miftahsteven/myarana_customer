import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Dashboard from '../app/screens/Dashboard';
import MyPackage from '../app/screens/Service/MyPackage';
import Product from '../app/screens/Product';
import Chat from '../app/screens/Chat';

const Tab = createBottomTabNavigator();

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 50,
          left: 20,
          right: 20,
          backgroundColor: '#ffffff',
          borderRadius: 30, // Make it oval/rounded
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          height: 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#673284ff', // Livin Blue
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyPackage') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Product') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          }

      // Use the component
          return <IconComponent name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Beranda' }} />
      <Tab.Screen name="MyPackage" component={MyPackage} options={{ title: 'Paket Saya' }} />
      <Tab.Screen name="Product" component={Product} options={{ title: 'Produk' }} />
      <Tab.Screen name="Chat" component={Chat} options={{ title: 'Chat', tabBarStyle: { display: 'none' } }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppStack;
