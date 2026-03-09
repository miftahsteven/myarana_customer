import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
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

const ServiceListScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [idUser, setIdUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        setIdUser(JSON.parse(userData).userLoggedIn.id);
      }
    };
    fetchUserData();
  }, []);

  const handleAddService = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Peringatan', 'Silahkan masukkan Email, No. Handphone, atau CID anda.');
      return;
    }

    setLoading(true);
    try {
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
          ? process.env.EXPO_PUBLIC_API_DEV_URL 
          : process.env.EXPO_PUBLIC_API_URL;  
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${BASE_URL}/auth/mobile/add_services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: inputValue }),
      });
      const result = await response.json();

      console.log("result", result);
      console.log("response", response);      
      if (response.ok) {
        Alert.alert('Berhasil', 'Layanan berhasil ditambahkan ke akun anda.');
        setModalVisible(false);
        setInputValue('');
        // Logic to refresh service list would go here
      } else {
        Alert.alert('Gagal', result.message || 'Data tidak ditemukan atau sudah terdaftar.');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi gangguan koneksi. Silahkan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getServicesByFirebase = (userId) => {
    const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${userId}`;    
    const userRef = ref(db, urlpath);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.activeServices && data.activeServices.length > 0) {
            setServices(data.activeServices);
        }
      }
    });
    return unsubscribe; // return cleanup function
  }

  useEffect(() => {
    if (idUser) {
      const unsubscribe = getServicesByFirebase(idUser);
      return () => unsubscribe && unsubscribe(); // cleanup on unmount
    }
  }, [idUser]); 

  const formatCurrency = (number) => {
    if (!number) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePayTagihan = async (invoiceId) => {
    if (!invoiceId) {
      Alert.alert('Informasi', 'ID Tagihan tidak ditemukan.');
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV'
        ? process.env.EXPO_PUBLIC_API_DEV_URL
        : process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${BASE_URL}/invoices/pay_now/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.data?.redirect_url) {
        navigation.navigate('SnapPayment', { url: data.data.redirect_url });
      } else {
        Alert.alert('Gagal', data?.message || 'Tidak dapat memproses pembayaran.');
      }
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan koneksi.');
    }
  };

  // One-shot blink component
  const BlinkPayButton = ({ onPress }) => {
    const blinkAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 300, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 300, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 300, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 300, useNativeDriver: true }),
      ]).start();
    }, []);
    return (
      <Animated.View style={{ opacity: blinkAnim }}>
        <TouchableOpacity style={styles.payButton} onPress={onPress} activeOpacity={0.8}>
          <Ionicons name="card-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.payButtonText}>Bayar Tagihan</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderServiceItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="wifi" size={24} color="#0066AE" />
        </View>
        <View style={[
          styles.statusBadge,
          item.state && item.state.toLowerCase() !== 'aktif' ? { backgroundColor: '#F2F2F2' } : {}
        ]}>
          <Text style={[
            styles.statusText,
            item.state && item.state.toLowerCase() !== 'aktif' ? { color: '#FF3B30' } : {}
          ]}>{item.state || 'Aktif'}</Text>
        </View>
      </View>
      <Text style={styles.serviceTitle}>{item.name || 'Arana Internet'}</Text>
      <View style={styles.infoRow}>
        <Ionicons name="barcode-outline" size={14} color="#7F8C8D" />
        <Text style={styles.cidLabel}>SID: {item.sid || '123456789'}</Text>
      </View>
      <View style={styles.priceContainer}>
        <View style={styles.priceIconWrapper}>
            <Ionicons name="pricetag" size={14} color="#673284ff" />
        </View>
        <Text style={styles.priceText}>
          Rp {formatCurrency(item.monthly_charge)}<Text style={styles.priceSubText}> / bln</Text>
        </Text>
      </View>

      {/* Bayar button: only when invoice_id exists AND status is not aktif */}
      {item.invoice_id && item.state && item.state.toLowerCase() !== 'aktif' ? (
        <BlinkPayButton onPress={() => handlePayTagihan(item.invoice_id)} />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity> 

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Layanan Saya</Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={60} color="#BDC3C7" />
          </View>
          <Text style={styles.emptyTitle}>Layanan anda belum tersedia</Text>
          <Text style={styles.emptySubtitle}>Hubungkan akun anda dengan CID atau nomor telepon yang terdaftar.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Sinkronisasi Layanan</Text>
            <Text style={styles.modalDesc}>Masukkan identitas layanan anda untuk menghubungkan data.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email / No HP / CID"
              placeholderTextColor="#95A5A6"
              value={inputValue}
              onChangeText={setInputValue}
            />

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddService}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    backgroundColor: '#673284ff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerSubtitle: {
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FF9F0A',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FF9F0A',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  listPadding: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cidLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
    fontWeight: '600',
  },
  addressLabel: {
    fontSize: 13,
    color: '#95A5A6',
    marginLeft: 8,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(103, 50, 132, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#673284ff',
  },
  priceSubText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#95A5A6',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#673284ff',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBody: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    paddingTop: 36, // Increased top padding to give space for the close button
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    position: 'relative', // Need this for absolute positioning of the close button
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F8F9F9',
    borderWidth: 1,
    borderColor: '#E5E7E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 20,
  },
});

export default ServiceListScreen;
