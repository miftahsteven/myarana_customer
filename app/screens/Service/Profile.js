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
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const Profile = ({ navigation }) => {
  const { logout } = useAuth();
  const [userData, setUserData] = useState({
    nama: '',
    email: '',
    phone: '',
    id: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const data = await SecureStore.getItemAsync('userData');
      if (data) {
        const userData = JSON.parse(data);
        const nama = userData.userLoggedInDetail.complete_name;
        const email = userData.userLoggedIn.email;
        const phone = userData.userLoggedIn.username;
        const id = userData.userLoggedIn.id;
        setUserData({ nama, email, phone, id });
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {      
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;
      
      // Best-effort API logout, ignore errors (e.g. 401 expired token)
      await axios.get(`${BASE_URL}/auth/mobile/logout`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // silently ignore API errors
    } catch (error) {
      // do nothing
    } finally {
      // Always clear local storage and trigger global auth state change
      await SecureStore.multiRemove(['token', 'userData']);
      setLoading(false);
      logout(); // triggers root navigator to switch to AuthStack -> Login
    }
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>

          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (userData.nama || 'Steve+Job') + '&background=random&color=fff' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userData.nama || 'Steve Job'}</Text>
          <Text style={styles.profileTagline}>Member Premium</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#673284ff" />
              <TextInput style={styles.input} value={userData.nama} editable={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#673284ff" />
              <TextInput style={styles.input} value={userData.email} editable={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Handphone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#673284ff" />
              <TextInput style={styles.input} value={userData.phone} editable={false} />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.changePasswordLink}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.row}>
              <Ionicons name="key-outline" size={20} color="#666" />
              <Text style={styles.changePasswordText}>Ubah Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleLogout} disabled={loading}>
            <LinearGradient
              colors={['#4c669f', '#414b60ff', '#673284ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color="#FFF" />
                  <Text style={styles.logoutBtnText}>Keluar Akun</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 50 },
  headerTop: { flexDirection: 'row', width: '100%', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', zIndex: 10 },
  backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 40, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFF' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#673284ff', padding: 6, borderRadius: 15, elevation: 3 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
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
  changePasswordLink: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#EEE' 
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  changePasswordText: { marginLeft: 10, fontSize: 15, color: '#666', fontWeight: '500' },
  footer: { paddingHorizontal: 20, marginTop: 40, paddingBottom: 50 },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 15, 
    elevation: 5, 
    shadowColor: '#673284ff', 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 5 } 
  },
  logoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default Profile;
