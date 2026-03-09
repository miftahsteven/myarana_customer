import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, off, set } from "firebase/database"; // ADD
import { 
  COMPANY_ID, MODE, EXPO_PUBLIC_API_DEV_URL,
  FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, 
  FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, 
  FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID 
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);


const Profile = ({ navigation }) => {
  const { logout } = useAuth();
  const [userData, setUserData] = useState({
    nama: '',
    email: '',
    phone: '',
    id: '',
  });
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState('');
  const [idUser, setIdUser] = React.useState(null); 
  const [name, setName] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Password Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(''); 
  const [pwMsgType, setPwMsgType] = useState('error');

  // Change Profile States
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileMsgType, setProfileMsgType] = useState('error');
  
  // OTP Timer States
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (otpModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [otpModalVisible, countdown]);

  const openProfileModal = () => {
    setEditName(userData.nama);
    setEditEmail(userData.email);
    setEditPhone(userData.phone);
    setProfileMsg('');
    setProfileModalVisible(true);
  };

  const validateName = (text) => {
    return /^[a-zA-Z\s]*$/.test(text); // Only alphabets and spaces
  };

  const handleSendOTP = async () => {
    setProfileMsg('');
    if (!editName || !editEmail || !editPhone) {
      setProfileMsgType('error');
      setProfileMsg('Semua kolom harus diisi.');
      return;
    }
    if (!validateName(editName)) {
      setProfileMsgType('error');
      setProfileMsg('Nama tidak boleh mengandung angka atau simbol.');
      return;
    }

    setProfileLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;

      const payload = {
        complete_name: editName,
        phone_number: editPhone,
        email: editEmail
      };

      const response = await fetch(`${BASE_URL}/auth/mobile/change_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (response.ok) {
        // Flow: email or phone changed, OTP required.
        setProfileModalVisible(false); // Close profile form
        setOtpInput(''); // Clear previous OTP Input
        setOtpModalVisible(true); // Open OTP form
        setCountdown(60); // Reset countdown clock target
        setCanResend(false); // Reset resend capabilities block
        setProfileMsg('');
      } else {
        setProfileMsgType('error');
        setProfileMsg(resJson.message || 'Gagal mengirim OTP.');
      }
    } catch (error) {
      setProfileMsgType('error');
      setProfileMsg('Terjadi kesalahan jaringan.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMsg('');
    const isEmailOrPhoneChanged = userData.email !== editEmail || userData.phone !== editPhone;

    if (isEmailOrPhoneChanged && !otpInput) {
      setProfileMsgType('error');
      setProfileMsg('OTP harus diisi.');
      return;
    }

    setProfileLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;

      const payload = { 
        complete_name: editName, 
        phone_number: editPhone, 
        email: editEmail
      };
      
      if (isEmailOrPhoneChanged) {
        payload.otp = otpInput;
      }

      const response = await fetch(`${BASE_URL}/auth/mobile/change_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (response.ok) {
         setProfileMsgType('success');
         setProfileMsg('Profil berhasil diperbarui!');
         
         // Update local data gracefully
         setUserData(prev => ({
           ...prev,
           nama: editName,
           email: editEmail,
           phone: editPhone
         }));

         setTimeout(() => {
           if (isEmailOrPhoneChanged) {
             setOtpModalVisible(false);
             setOtpInput('');
           } else {
             setProfileModalVisible(false);
           }
           setProfileMsg('');
         }, 1500);

      } else {
        setProfileMsgType('error');
        setProfileMsg(resJson.message || (isEmailOrPhoneChanged ? 'OTP salah atau kedaluwarsa.' : 'Gagal menyimpan profil.'));
      }
    } catch (error) {
      setProfileMsgType('error');
      setProfileMsg('Terjadi kesalahan jaringan.');
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePassword = (pass) => {
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const isLengthValid = pass.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && isLengthValid;
  };

  const handleChangePasswordSubmit = async () => {
    setPwMsg('');
    if (!password || !confirmPassword) {
      setPwMsgType('error');
      setPwMsg('Password dan Konfirmasi Password harus diisi.');
      return;
    }
    if (password !== confirmPassword) {
      setPwMsgType('error');
      setPwMsg('Password tidak cocok dengan konfirmasi.');
      return;
    }
    if (!validatePassword(password)) {
      setPwMsgType('error');
      setPwMsg('Validasi gagal: minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.');
      return;
    }

    setPwLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${BASE_URL}/auth/mobile/change_password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password, confirmPassword })
      });

      const resJson = await response.json();
      if (response.ok) {
        setPwMsgType('success');
        setPwMsg('Password berhasil diubah. Mengeluarkan akun...');
        setTimeout(() => {
          setModalVisible(false);
          setPassword('');
          setConfirmPassword('');
          setPwMsg('');
          handleLogout(); // Automatically logout to force login with new password
        }, 1500);
      } else {
        setPwMsgType('error');
        setPwMsg(resJson.message || 'Gagal mengubah password.');
      }
    } catch (error) {
      setPwMsgType('error');
      setPwMsg('Terjadi kesalahan jaringan rute API.');
    } finally {
      setPwLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const data = await SecureStore.getItemAsync('userData');
      if (data) {
        const userData = JSON.parse(data);
        const id = userData.userLoggedIn.id;
        setIdUser(id); 

        const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${id}/identity/detailUser`;    
        const userRef = ref(db, urlpath);
        onValue(userRef, (snapshot) => {
          const fbData = snapshot.val();
          if (fbData) {          
            // Using || '' to prevent undefined from breaking inputs
            const nama = fbData.complete_name || '';
            const email = fbData.email || '';
            const phone = fbData.phone || '';
            setUserData({ nama, email, phone, id }); 
          }
        });
      }
    };
    loadUserData();
  }, []);

  const getProfileByFirebase = (idUser) => {
      const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}`;    
      const userRef = ref(db, urlpath);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {          
          setName(data.identity?.detailUser?.complete_name);
          setCid(data.customerIdentity?.cid);
        }
      });
      
      const avatarPath = `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}/identity/detailUser/avatar`;
      const avatarRef = ref(db, avatarPath);
      onValue(avatarRef, (snapshot) => {
        if (snapshot.exists()) {
          setAvatar(snapshot.val());
        }
      });
  };

  useEffect(() => {
    if (idUser) {
      getProfileByFirebase(idUser);
    }
  }, [idUser]);

  const handleLogout = async () => {
    setLoading(true);
    try {      
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;

        //console.log("token", token);
        
      
      // Best-effort API logout, ignore errors (e.g. 401 expired token)
      const logout = await axios.get(`${BASE_URL}/auth/mobile/logout`, {
        headers: { Authorization: `Bearer ${token}` },

      }).catch(() => {}); // silently ignore API errors
      //console.log("logout", logout);
    } catch (error) {
      // do nothing
    } finally {
      // Always clear local storage and trigger global auth state change
      // await SecureStore.multiRemove(['token', 'userData']);
       await SecureStore.deleteItemAsync('token');
       await SecureStore.deleteItemAsync('userData');
      setLoading(false);
      logout(); // triggers root navigator to switch to AuthStack -> Login
    }
  };

  const handlePickAndUploadAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images', //deprecated        
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled) {
        setAvatarLoading(true);
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split('/').pop();
        
        // Infer the type of the image
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('file', { uri: imageUri, name: filename, type });

        const token = await SecureStore.getItemAsync('token');
        const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
        const BASE_URL = API_CONFIG === 'DEV' 
          ? process.env.EXPO_PUBLIC_API_DEV_URL 
          : process.env.EXPO_PUBLIC_API_URL;

        const response = await fetch(`${BASE_URL}/users/upload/avatar`, {
          method: 'PUT',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        const resJson = await response.json();
        console.log("resJson", resJson);
        if (!response.ok) {
          Alert.alert('Gagal', resJson.message || 'Gagal mengunggah avatar.');
        } else {
          // Saat update berhasil, langsung ambil kembali data avatar di getProfileByFirebase
          getProfileByFirebase(idUser);
        }
      }
    } catch (error) {
      console.log('Error uploading avatar:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Keluar Akun",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Ya", onPress: handleLogout, style: "destructive" }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header Top Bar */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Halaman Profil</Text>
        {/* Spacer for centering title */}
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 25}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>

          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={() => avatar && setAvatarViewerVisible(true)} disabled={!avatar}>
              {
                avatar ? (
                  <Image 
                    source={{ uri: EXPO_PUBLIC_API_DEV_URL+avatar }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <Image
                    source={{ uri: 'https://ui-avatars.com/api/?name=' + (userData.nama || 'Invisible+Name') + '&background=random&color=fff' }}
                    style={styles.avatar}
                  />
                )
              }            
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraBadge} onPress={handlePickAndUploadAvatar} disabled={avatarLoading}>
              {avatarLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userData.nama || 'Steve Job'}</Text>
          <Text style={styles.profileTagline}>{cid}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#673284ff" />
              <TextInput 
                style={styles.input} 
                value={userData.nama} 
                editable={false} 
                onChangeText={(text) => setUserData({...userData, nama: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#673284ff" />
              <TextInput 
                style={styles.input} 
                value={userData.email} 
                editable={false} 
                onChangeText={(text) => setUserData({...userData, email: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Handphone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#673284ff" />
              <TextInput 
                style={styles.input} 
                value={userData.phone} 
                editable={false} 
                onChangeText={(text) => setUserData({...userData, phone: text})}
              />
            </View>
          </View>
          {/* Tombol Simpan Profil */}
          {/* <TouchableOpacity style={styles.saveProfileBtn} onPress={() => {}}>
            <LinearGradient colors={['#673284ff', '#9055A2']} style={styles.saveProfileGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveProfileText}>Simpan Profil</Text>
            </LinearGradient>
          </TouchableOpacity> */}


          <TouchableOpacity 
            style={styles.changePasswordLink}
            onPress={openProfileModal}
          >
            <View style={styles.row}>
              <Ionicons name="person-outline" size={20} color="#673284ff" />
              <Text style={styles.changePasswordText}>Ubah Profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePasswordLink}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.row}>
              <Ionicons name="key-outline" size={20} color="#673284ff" />
              <Text style={styles.changePasswordText}>Ubah Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePasswordLink}
            onPress={confirmLogout}
          >
            <View style={styles.row}>
              <Ionicons name="log-out-outline" size={20} color="#673284ff" />
              <Text style={styles.changePasswordText}>Keluar Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* <View style={styles.footer}>
          <TouchableOpacity onPress={confirmLogout} disabled={loading} style={styles.logoutTextBtn}>
            {loading ? (
              <ActivityIndicator color="#673284ff" />
            ) : (
              <Text style={styles.logoutTextBtnContent}>Keluar Akun</Text>
            )}
          </TouchableOpacity>
        </View> */}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ubah Profil</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {profileMsg !== '' && (
                <Text style={[styles.validationMsg, profileMsgType === 'success' ? styles.msgSuccess : styles.msgError]}>
                  {profileMsg}
                </Text>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="person-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masukkan nama Anda"
                    placeholderTextColor="#999"
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.label}>Nomor Handphone</Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="call-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masukkan nomor HP"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={editPhone}
                    onChangeText={setEditPhone}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masukkan email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editEmail}
                    onChangeText={setEditEmail}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={userData.email !== editEmail || userData.phone !== editPhone ? handleSendOTP : handleSaveProfile} 
                disabled={profileLoading}
              >
                <LinearGradient colors={['#673284ff', '#1b060aff']} style={styles.submitBtnGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                  {profileLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{userData.email !== editEmail || userData.phone !== editPhone ? 'Kirim OTP' : 'Simpan Perubahan'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* OTP Modal */}
      <Modal
        visible={otpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verifikasi OTP</Text>
                <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {profileMsg !== '' && (
                <Text style={[styles.validationMsg, profileMsgType === 'success' ? styles.msgSuccess : styles.msgError]}>
                  {profileMsg}
                </Text>
              )}
              
              <Text style={styles.otpDescriptionText}>
                Kode OTP telah dikirimkan ke email Anda. Silakan cek kotak masuk/spam dan masukkan kode di bawah ini.
              </Text>

              <View style={styles.modalInputGroup}>
                <Text style={styles.label}>Kode OTP</Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="keypad-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Masukkan 4-6 digit OTP"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={otpInput}
                    onChangeText={setOtpInput}
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.countdownContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleSendOTP} disabled={profileLoading}>
                    <Text style={styles.resendTextBold}>
                      Belum menerima OTP? <Text style={styles.resendActionText}>Kirim Ulang OTP</Text>
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.countdownText}>
                    Kirim ulang OTP dalam <Text style={styles.countdownNumberText}>00:{countdown.toString().padStart(2, '0')}</Text>
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfile} disabled={profileLoading}>
                <LinearGradient colors={['#673284ff', '#1b060aff']} style={styles.submitBtnGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                  {profileLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Simpan Perubahan</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Password</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {pwMsg !== '' && (
              <Text style={[styles.validationMsg, pwMsgType === 'success' ? styles.msgSuccess : styles.msgError]}>
                {pwMsg}
              </Text>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={styles.label}>Password Baru</Text>
              <View style={styles.modalInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Masukkan password baru"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.label}>Konfirmasi Password Baru</Text>
              <View style={styles.modalInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#673284ff" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ulangi password baru"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>*Minimal 8 karakter, ada huruf besar, kecil & angka.</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleChangePasswordSubmit} disabled={pwLoading}>
              <LinearGradient colors={['#673284ff', '#1b060aff']} style={styles.submitBtnGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                {pwLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Ubah Password</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Avatar Fullscreen Viewer */}
      <Modal
        visible={avatarViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarViewerVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.closeViewerBtn} onPress={() => setAvatarViewerVisible(false)}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {avatar && (
            <Image 
              source={{ uri: EXPO_PUBLIC_API_DEV_URL+avatar }} 
              style={styles.viewerImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  headerTop: { flexDirection: 'row', width: '100%', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', zIndex: 10 },
  backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#673284ff' },
  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 40, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFF' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#673284ff', padding: 6, borderRadius: 15, elevation: 3 },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  profileTagline: { fontSize: 13, color: '#673284ff', fontWeight: '600', marginTop: 4 },
  formCard: { 
    padding: 20, 
    marginTop: -20, 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    borderRadius: 20, 
    elevation: 8, 
    shadowColor: '#673284ff', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 5 } 
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '600', marginLeft: 4 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#EFEFEF' 
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333', paddingVertical: 0 },
  saveProfileBtn: { marginTop: 5, marginBottom: 5, borderRadius: 12, overflow: 'hidden' },
  saveProfileGradient: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveProfileText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  changePasswordLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#F2F2F2', marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  changePasswordText: { fontSize: 14, fontWeight: 'bold', color: '#673284ff', marginLeft: 10 },
  footer: { paddingHorizontal: 20, marginTop: 15, alignItems: 'center' },
  logoutTextBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  logoutTextBtnContent: { color: '#673284ff', fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: -5 }, maxHeight: '95%' },
  modalScrollContainer: { flexGrow: 1, justifyContent: 'flex-end' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  validationMsg: { fontSize: 13, marginBottom: 15, padding: 10, borderRadius: 8, overflow: 'hidden' },
  msgError: { color: '#d32f2f', backgroundColor: '#ffebee' },
  msgSuccess: { color: '#2e7d32', backgroundColor: '#e8f5e9' },
  modalInputGroup: { marginBottom: 16 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE' },
  inputIcon: { marginRight: 10 },
  modalInput: { flex: 1, height: 50, color: '#333', fontSize: 14 },
  passwordHint: { fontSize: 11, color: '#888', marginTop: 6, fontStyle: 'italic' },
  otpDescriptionText: { fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 20 },
  countdownContainer: { alignItems: 'center', marginBottom: 15 },
  countdownText: { fontSize: 13, color: '#666' },
  countdownNumberText: { fontWeight: 'bold', color: '#673284ff' },
  resendTextBold: { fontSize: 13, color: '#666' },
  resendActionText: { fontWeight: 'bold', color: '#673284ff', textDecorationLine: 'underline' },
  submitBtn: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  submitBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeViewerBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
  viewerImage: { width: '100%', height: '80%' }
});

export default Profile;
