import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const ForgotPassword = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
  const BASE_URL = API_CONFIG === 'DEV'
    ? process.env.EXPO_PUBLIC_API_DEV_URL
    : process.env.EXPO_PUBLIC_API_URL;

  const handleForgotPassword = async () => {
    const inputUsername = typeof username === 'string' ? username.trim() : '';

    if (!inputUsername) {
      return Alert.alert('Error', 'Silakan masukkan email atau nomor handphone Anda.');
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/mobile/forgot_password`, {
        username: inputUsername,
      });

      Alert.alert(
        'Berhasil',
        'Instruksi reset password telah dikirimkan ke email atau nomor handphone Anda.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gagal mengirim permintaan. Periksa koneksi atau pastikan akun terdaftar.';
      Alert.alert('Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/login_background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      {/* Slightly lighter gradient overlay compared to Login */}
      <LinearGradient
        colors={['rgba(24, 90, 157, 0.75)', 'rgba(58, 28, 113, 0.65)', 'rgba(24, 90, 157, 0.85)']}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/inverse.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Lupa Password</Text>
              <Text style={styles.instructionText}>
                Masukkan email atau nomor handphone yang terdaftar. Kami akan mengirimkan instruksi untuk mereset password Anda.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email / No. Handphone</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#aaa" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan email atau no. HP"
                    placeholderTextColor="#aaa"
                    value={username}
                    onChangeText={(val) => setUsername(val)}
                    keyboardType="default"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleForgotPassword}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4c669f', '#3b5998', '#673284ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Mengirim...' : 'Kirim Instruksi Reset'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
                <Text style={styles.backToLoginText}>Kembali ke Login</Text>
              </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 0,
    padding: 10,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    shadowColor: '#8e19a0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  header: {
    marginBottom: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 15,
  },
  submitButton: {
    height: 55,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#4c669f',
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
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 5,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#aae4ff',
    textDecorationLine: 'underline',
  },
});

export default ForgotPassword;