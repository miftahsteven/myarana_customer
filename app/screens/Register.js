import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const { width } = Dimensions.get('window');

const Register = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  // OTP Countdown Logic
  useEffect(() => {
    let interval;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  
  const validatePassword = (pass) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    return strongRegex.test(pass);
  };

  const validateName = (name) => {
    // Hanya huruf dan spasi yang diizinkan
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  // Tentukan Base URL berdasarkan environment .env
  const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
  const BASE_URL = API_CONFIG === 'DEV' 
    ? process.env.EXPO_PUBLIC_API_DEV_URL 
    : process.env.EXPO_PUBLIC_API_URL;

  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) return Alert.alert('Error', 'Semua input wajib diisi');
      
      if (formData.name.trim().length <= 1) {
        return Alert.alert('Error', 'Nama harus lebih dari 1 karakter');
      }
      if (formData.name.trim().length > 50) {
        return Alert.alert('Error', 'Nama maksimal 50 karakter');
      }
      if (!validateName(formData.name)) {
        return Alert.alert('Error', 'Nama tidak boleh mengandung angka atau simbol');
      }
      
      // Validasi awalan nomor HP
      if (!formData.phone.startsWith('0')) {
        return Alert.alert('Error', 'Nomor handphone harus diawali dengan angka 0 (contoh: 08...)');
      }
      // Tambahan validasi panjang nomor HP (opsional tapi disarankan)
      if (formData.phone.length < 10 || formData.phone.length > 15) {
        return Alert.alert('Error', 'Nomor handphone tidak valid (pastikan panjang nomor antara 10-15 digit)');
      }

      if (!validateEmail(formData.email)) return Alert.alert('Error', 'Format email tidak valid');
      setStep(2);
    } else if (step === 2) {
      if (!validatePassword(formData.password)) {
        return Alert.alert('Error', 'Password harus minimal 8 karakter, mengandung huruf besar, kecil, dan angka');
      }
      if (formData.password !== formData.confirmPassword) {
        return Alert.alert('Error', 'Konfirmasi password tidak cocok');
      }

      setLoading(true);
      try {
        // Hit API Saat klik "Selanjutnya" di Step 2 (Tanpa mengirimkan parameter OTP)
        await axios.post(`${BASE_URL}/auth/mobile/customer/registration`, {
          email: formData.email,
          phone_number: formData.phone,
          name: formData.name,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        
        setLoading(false);
        setStep(3); // Pindah ke layar OTP
      } catch (error) {
        setLoading(false);
        const errorMsg = error.response?.data?.message || 'Gagal mengirim OTP, silakan coba lagi';
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleRegister = async () => {
    if (formData.otp.length < 4) return Alert.alert('Error', 'Masukkan kode OTP yang valid');
    
    setLoading(true);
    try {
      // Hit API saat di layar terakhir (Mengirim parameter OTP)
      await axios.post(`${BASE_URL}/auth/mobile/customer/registration`, {
        email: formData.email,
        phone_number: formData.phone,
        name: formData.name,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        otp: formData.otp
      });
      
      setLoading(false);
      setIsSuccess(true);
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || 'Registrasi gagal, silakan coba lagi atau cek kembali OTP Anda';
      Alert.alert('Error', errorMsg);
    }
  };

  const resendOTP = async() => {
    setTimer(60);
    // Trigger resend API here
    try {
      // Hit API saat di layar terakhir (Mengirim parameter OTP)
      console.log(
        "test",
        JSON.stringify(formData)
      );
      
      await axios.post(`${BASE_URL}/auth/mobile/customer/registration`, {
        email: formData.email,
        phone_number: formData.phone,
        name: formData.name,
        password: formData.password,
        confirmPassword: formData.confirmPassword,        
      });
      
      setLoading(false);
      //setIsSuccess(true);
      alert(response.data.message);
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || 'Registrasi gagal, silakan coba lagi atau cek kembali OTP Anda';
      Alert.alert('Error', errorMsg);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
      ))}
    </View>
  );

  if (isSuccess) {
    return (
      <ImageBackground
        source={require('../../assets/onboarding.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <StatusBar style="light" />
        <LinearGradient
          colors={['rgba(15, 12, 41, 0.8)', 'rgba(48, 43, 99, 0.7)', 'rgba(36, 36, 62, 0.9)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.container}>
            <View style={styles.successCard}>
              <Text style={styles.title}>Registrasi Berhasil!</Text>
              <Text style={styles.subtitle}>Akun Anda telah aktif. Silakan login untuk melanjutkan.</Text>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Ke Halaman Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/onboarding.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(15, 12, 41, 0.8)', 'rgba(48, 43, 99, 0.7)', 'rgba(36, 36, 62, 0.9)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Registrasi</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
          {renderStepIndicator()}

          <View style={styles.formContainer}>
            {step === 1 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama Lengkap</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama"
                    placeholderTextColor="#666"
                    value={formData.name}
                    onChangeText={(val) => updateFormData('name', val)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="nama@email.com"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(val) => updateFormData('email', val.toLowerCase())}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nomor Handphone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0812..."
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={formData.phone}
                    onChangeText={(val) => updateFormData('phone', val.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#666"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(val) => updateFormData('password', val)}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={24} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konfirmasi Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#666"
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onChangeText={(val) => updateFormData('confirmPassword', val)}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye" : "eye-off"} 
                        size={24} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.hintText}>* Minimal 8 karakter, huruf besar & angka</Text>
              </>
            )}

            {step === 3 && (
              <View style={styles.otpSection}>
                <Text style={styles.label}>Masukkan Kode OTP</Text>
                <Text style={styles.hintText}>Kode dikirim ke {formData.email}</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="0000"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  maxLength={6}
                  value={formData.otp}
                  onChangeText={(val) => updateFormData('otp', val)}
                />
                <Text style={styles.timerText}>
                  {timer > 0 ? `Kirim ulang dalam ${timer}s` : (
                    <Text style={styles.resendLink} onPress={resendOTP}>Kirim Ulang OTP</Text>
                  )}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]} 
              onPress={step === 3 ? handleRegister : handleNextStep}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : step === 3 ? 'Verifikasi & Daftar' : 'Selanjutnya'}
              </Text>
            </TouchableOpacity>

            {step > 1 && !loading && (
              <TouchableOpacity onPress={() => setStep(step - 1)}>
                <Text style={styles.backText}>Kembali</Text>
              </TouchableOpacity>
            )}
          </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // justifyContent: 'center',
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#af2ad0ff', marginBottom: 8, marginTop: 40 },
  subtitle: { color: '#94A3B8', fontSize: 16, marginBottom: 20 },
  stepContainer: { flexDirection: 'row', marginBottom: 40 },
  stepDot: { width: 40, height: 4, backgroundColor: '#1E293B', marginHorizontal: 4, borderRadius: 2 },
  stepDotActive: { backgroundColor: '#bb8cc8ff' },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#E2E8F0', marginBottom: 8, fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: '#a37eadff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  backText: { color: '#94A3B8', textAlign: 'center', marginTop: 20, fontSize: 14 },
  hintText: { color: '#64748B', fontSize: 12, marginTop: 4 },
  otpSection: { alignItems: 'center', marginVertical: 20 },
  otpInput: {
    fontSize: 32,
    letterSpacing: 10,
    color: '#38BDF8',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#38BDF8',
    width: '60%',
    paddingVertical: 10,
    marginVertical: 20,
  },
  timerText: { color: '#94A3B8', marginTop: 10 },
  resendLink: { color: '#38BDF8', fontWeight: 'bold' },
  successCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
});

export default Register;
