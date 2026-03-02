import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '28bab746-b073-4544-8482-bcec0ef4eb0b';

Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
});

// Get device push token
const getExpoPushTokenSafe = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Expo Push Token only on real devices');
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    return token.data;
  } catch (error) {
    console.error('Error getting Expo Push Token:', error);
    return null;
  }
};

const loginUpdateDeviceId = async (userId, deviceId, sessionToken) => {
  if (!sessionToken || !deviceId || !userId) return;
  const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
  const BASE_URL = API_CONFIG === 'DEV' 
    ? process.env.EXPO_PUBLIC_API_DEV_URL 
    : process.env.EXPO_PUBLIC_API_URL;
  try {
    // Skip jika sama dengan yang tersimpan
    const prev = await AsyncStorage.getItem('expoPushToken');
    if (prev && prev === deviceId) {
      return;
    }
    const res = await fetch(`${BASE_URL}/users/update_device_id/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
    if (!res.ok) {
      console.warn('Update device_id failed status:', res.status);
      return;
    }
    await AsyncStorage.setItem('expoPushToken', deviceId);
    console.log('Device ID updated');
  } catch (e) {
    console.warn('Update device_id error:', e.message);
  }
};

const Login = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();

  const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
  const BASE_URL = API_CONFIG === 'DEV' 
    ? process.env.EXPO_PUBLIC_API_DEV_URL 
    : process.env.EXPO_PUBLIC_API_URL;

  const handleLogin = async () => {
    // Memastikan nilai tidak typeof undefined/null (menghindari error .trim())
    const inputUsername = typeof username === 'string' ? username.trim() : '';
    const inputPassword = typeof password === 'string' ? password.trim() : '';

    if (!inputUsername || !inputPassword) {
      return Alert.alert('Error', 'Username dan Password wajib diisi');
    }

    // Identifikasi apakah username adalah email yang valid, atau format nomor handphone
    const isEmail = /\S+@\S+\.\S+/.test(inputUsername);
    const isPhone = /^[0-9]+$/.test(inputUsername) && inputUsername.startsWith('0');

    if (!isEmail && !isPhone) {
      return Alert.alert('Error', 'Username yang dimasukkan harus berupa email valid atau nomor handphone yang diawali angka 0');
    }

    setLoading(true);
    try {
      //console.log(inputUsername, inputPassword);
      
      const response = await axios.post(`${BASE_URL}/auth/mobile/login`, {
        username: inputUsername,
        password: inputPassword
      });

      //console.log(JSON.stringify(response.data));
      let userData = response.data.data;
      
      //saat response berhasil masukan data ke async storage
      await AsyncStorage.setItem('token', userData.session.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setLoading(false);
      
      // Update the AuthContext to notify it's authenticated
      // Pastikan auth menggunakan inputUsername, bukan string yang mengandung blank character di awal/akhir
      login(inputUsername, inputPassword);

      // Get Expo Push Token
      const expoPushToken = await getExpoPushTokenSafe();
      console.log("Expo Push Token:", expoPushToken);

      // Update device ID on the server
      if (expoPushToken) {
        await loginUpdateDeviceId(userData.userLoggedIn.id, expoPushToken, userData.session.token);
      } else {
        console.log('No Expo Push Token available');
      }
      
      // Jika Anda tidak menggunakan logic navigator Context,
      // Anda bisa membuka ini: navigation.navigate('Dashboard');
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || 'Login gagal, periksa koneksi atau input Anda';
      Alert.alert('Gagal Login', errorMsg);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/login_background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(15, 12, 41, 0.8)', 'rgba(48, 43, 99, 0.7)', 'rgba(36, 36, 62, 0.9)']}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.logoContainer}>
               <Image 
                  source={require('../../assets/inverse.png')}
                  style={styles.logo}
                  resizeMode="contain"
               />
            </View>

            <View style={styles.header}>
              <Text style={styles.welcomeText}>Silahkan Login</Text>
              <Text style={styles.instructionText}>Untuk Mendapatkan Akses Ke Layanan MyArana</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email/No.Handphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukan Username Anda"
                  placeholderTextColor="#aaa"
                  value={username}
                  onChangeText={(val) => setUsername(val)} // Ensure we only set the string value
                  keyboardType="default"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Kata Sandi</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Masukan Kata Sandi Anda"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                     style={styles.eyeIcon} 
                     onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={24} 
                      color="#aaa" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  // colors={['#00c6ff', '#0072ff']}
                  colors={['#4c669f', '#3b5998', '#673284ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Memproses...' : 'Masuk'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.registerContainer}> 
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>
                  Belum Punya Akun? 
                </Text>               
              </TouchableOpacity>
              <Text style={styles.spacer}> | </Text>
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.registerText}>
                  Lupa Password?
                </Text>               
              </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  gradientOverlay: {
    flex: 1,
    padding: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  spacer: {
    color: '#fff',
    marginHorizontal: 10,
    paddingTop: 8
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',    
  },
  logo: {
    width: 150,
    height: 150,
    // Add shadow/glow effect for the requested "3D/Siluet" feel
    shadowColor: '#8e19a0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    // Creating a pseudo-silhouette effect if needed by tinting, but user asked for "silhouette in the SAME color as background"
    // Usually that implies a watermark look, but they also said "eyecatching". 
    // I will keep it untinted initially but with a glow to make it pop against the dark background.
    // If silhouette specifically means single color, we can add `tintColor: 'rgba(255,255,255,0.8)'`
  },
  header: {
    marginBottom: 10,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  instructionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#eee',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 14,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  loginButton: {
    height: 55,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#00c6ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    fontSize: 14,
    color: '#00c6ff', 
    textDecorationLine: 'underline',
  },
});

export default Login;
