import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const AccountDeletion = ({ navigation }) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('userData');
    } catch (error) {
      console.log('Error during logout:', error);
    } finally {
      logout();
    }
  };

  const onShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    // Tangkap deeplink dari webview
    if (url && url.startsWith('myarana://success')) {
      if (url.includes('user_id=')) {
        Alert.alert(
          "Akun Terhapus",
          "User anda telah terhapus.",
          [
            { 
              text: "OK", 
              onPress: () => handleLogout() 
            }
          ],
          { cancelable: false }
        );
      }
      return false; // Hentikan proses loading pada deeplink
    }
    return true; // Lanjutkan loading untuk URL lain
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hapus Akun</Text>
        {/* Spacer for centering title */}
        <View style={{ width: 40 }} />
      </View>
      <WebView
        source={{ uri: 'https://myarana.arana.net.id' }}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={() => (
           <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#673284ff" />
           </View>
        )}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTop: { 
    flexDirection: 'row', 
    width: '100%', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 10, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    zIndex: 10 
  },
  backButton: { 
    padding: 8, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    shadowOffset: { width: 0, height: 1 } 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1C1C1E' 
  },
});

export default AccountDeletion;