import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Image, Dimensions, StatusBar as RNStatusBar, Platform, Animated, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, off, set } from "firebase/database"; // ADD
import { 
  COMPANY_ID, MODE, EXPO_PUBLIC_API_DEV_URL,
  FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, 
  FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, 
  FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID 
} from '@env';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import * as Notifications from 'expo-notifications';

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


const { width } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function setupNotifications() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [200, 100, 200, 100, 200],
      lightColor: '#6621817c',  
      sound: 'notification.wav',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });    
  }
}

const Dashboard = ({ navigation }) => {
  // Blinking animation for status dot
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const serviceTabsRef = useRef(null);
  const [profile, setProfile] = React.useState({});
  const [name, setName] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [idUser, setIdUser] = React.useState(null);
  const [activeServices, setActiveServices] = React.useState([]);
  const [selectedServiceIndex, setSelectedServiceIndex] = React.useState(0);
  const [packageName, setPackageName] = React.useState(null);
  const [packagePrice, setPackagePrice] = React.useState(null);
  const [packageState, setPackageState] = React.useState(null);
  const [cid, setCid] = React.useState(null);
  const [sid, setSid] = React.useState(null);
  const [invoice, setInvoice] = React.useState(null);
  const [invoices, setInvoices] = React.useState([]);
  const [invoiceId, setInvoiceId] = React.useState(null);
  const [invoiceState, setInvoiceState] = React.useState(null);
  const [invoiceDate, setInvoiceDate] = React.useState(null);   
  const [invoiceAmount, setInvoiceAmount] = React.useState(null);
  const [invoiceDueDate, setInvoiceDueDate] = React.useState(null); 
  const [unreadNotifCount, setUnreadNotifCount] = React.useState(0);
  const [poin, setPoin] = React.useState(0);
  const { logout } = useAuth();

  const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
    const BASE_URL = API_CONFIG === 'DEV' 
      ? process.env.EXPO_PUBLIC_API_DEV_URL 
      : process.env.EXPO_PUBLIC_API_URL;  
  

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        setIdUser(JSON.parse(userData).userLoggedIn.id);
      }
    };
    fetchUserData();
  }, []);

  const getProfileByFirebase = (idUser) => {
    const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}`;    
    const userRef = ref(db, urlpath);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfile(data);
        
        if (data.activeServices && data.activeServices.length > 0) {
            setActiveServices(data.activeServices);
            // Default to first service
            setPackageName(data.activeServices[0]?.name);
            setPackagePrice(data.activeServices[0]?.monthly_charge);
            setPackageState(data.activeServices[0]?.state);
            setSid(data.activeServices[0]?.sid);
        }

        if (data.identity && data.identity.detailUser) {
            setName(data.identity.detailUser?.complete_name || '');
            setAvatar(data.identity.detailUser?.avatar || '');
            setPoin(data.identity.detailUser?.poin || 0);
        }
        
        if (data.invoices && data.invoices.length > 0) {
            setInvoice(data.invoices[0]?.invoice);
            setInvoices(data.invoices);
            setInvoiceId(data.invoices[0]?.invoice?.invoice_id);
            if (data.invoices[0]?.detail && data.invoices[0].detail.length > 0) {
                setInvoiceState(data.invoices[0].detail[0]);        
            }
            setInvoiceAmount(data.invoices[0]?.invoice?.invoice_total);
            setInvoiceDueDate(data.invoices[0]?.invoice?.invoice_due_date);
        } else {
            setInvoices([]);
        }

        setCid(data.customerIdentity?.cid);

        // Also get unread notif count
        if (data.notifications && data.notifications.unread) {
            setUnreadNotifCount(data.notifications.unread);
        } else {
            setUnreadNotifCount(0);
        }
      }
    });
  }

  // Switch displayed service when user picks a different tab
  const handleSelectService = (index) => {
    setSelectedServiceIndex(index);
    const svc = activeServices[index];
    if (svc) {
      setPackageName(svc.name);
      setPackagePrice(svc.monthly_charge);
      setPackageState(svc.state);
      setSid(svc.sid);
    }
  };

  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    blinkAnimation.start();

    return () => blinkAnimation.stop();
  }, [blinkAnim]);

  useEffect(() => {
    if (idUser) {
      getProfileByFirebase(idUser);
    }
  }, [idUser]);

  // One-shot swipe hint when multiple services are loaded
  useEffect(() => {
    if (activeServices.length > 1 && serviceTabsRef.current) {
      const timer = setTimeout(() => {
        serviceTabsRef.current?.scrollTo({ x: 70, animated: true });
        setTimeout(() => {
          serviceTabsRef.current?.scrollTo({ x: 0, animated: true });
        }, 450);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [activeServices.length]);

  // Menu Grid Data
  const menuItems = [
    { id: 1, title: 'Tagihan', icon: 'receipt-outline', bgColor: '#1E88E5', onPress: () => navigation.navigate('MyInvoices') },
    { id: 2, title: 'Riwayat Transaksi', icon: 'time-outline', bgColor: '#F57F17', onPress: () => navigation.navigate('HistoryTransactions') },
    { id: 3, title: 'Tambah Layanan', icon: 'add-circle-outline', bgColor: '#43A047', onPress: () => navigation.navigate('AddService') },
    { id: 4, title: 'SpeedTest', icon: 'speedometer-outline', bgColor: '#D81B60', onPress: () => navigation.navigate('SpeedTest') },
    { id: 5, title: 'Chat Support', icon: 'chatbubbles-outline', bgColor: '#00ACC1', onPress: () => navigation.navigate('MainTabs', { screen: 'Chat' }) },
    { id: 6, title: 'Info', icon: 'information-circle-outline', bgColor: '#8E24AA', onPress: () => navigation.navigate('Informations') },
  ];

  const formatNumberWithCommas = (number) => {
    if (!number) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateString) => {
    //return format date monthName 4 digit year
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  const renderIcon = (item) => {
    // Removed, replaced with Image
    return null;
  };

  const handleDownloadTagihan = async () => {
    console.log(invoiceId);

    if (!invoiceId) {
      Alert.alert('Informasi', 'ID Tagihan tidak ditemukan.');
      return;
    }

    setLoading(true);
    try {
        const token = await SecureStore.getItemAsync('token');
        const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
        const BASE_URL = API_CONFIG === 'DEV' 
            ? process.env.EXPO_PUBLIC_API_DEV_URL 
            : process.env.EXPO_PUBLIC_API_URL;  
      
        const response = await fetch(`${BASE_URL}/invoices/export_pdf/${invoiceId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json().catch(() => null);  

        console.log("file", token);
        

        if (response.ok) {
            const url = data.data.file;
            const supported = await Linking.canOpenURL(url);
            
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Gagal', 'Tidak dapat membuka browser untuk mengunduh tagihan.');
            }
        } else {
            if (response.status === 401 || (data?.success === "false" && data?.message === "Sesi berakhir!")) {
                Alert.alert('Sesi Berakhir', 'Sesi Anda telah berakhir, silakan login kembali.', [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await SecureStore.deleteItemAsync('token');
                            await SecureStore.deleteItemAsync('userData');
                            await logout();
                        }
                    }
                ]);
                return;
            }
            Alert.alert('Gagal', data?.message || 'Gagal mengunduh tagihan.');
        }

    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengunduh tagihan.');
    } finally {
      setLoading(false);
    }
  };    

  const handlePayTagihan = async () => {
    console.log(invoiceId);

    if (!invoiceId) {
      Alert.alert('Informasi', 'ID Tagihan tidak ditemukan.');
      return;
    }

    const token = await SecureStore.getItemAsync('token');
    const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
    const BASE_URL = API_CONFIG === 'DEV' 
        ? process.env.EXPO_PUBLIC_API_DEV_URL 
        : process.env.EXPO_PUBLIC_API_URL;  

    const response = await fetch(`${BASE_URL}/invoices/pay_now/${invoiceId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json().catch(() => null);  

    console.log("data", data);

    if (response.ok) {
        const redirect_url = data.data.redirect_url;

        //open redirect ke routes SnapPayment
        navigation.navigate('SnapPayment', { url: redirect_url });

    }

  };    

  const handleLogout = async () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Ya", onPress: handleLogoutConfirm, style: "destructive" }
      ]
    );
  };

  const handleLogoutConfirm = async () => {
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background - Blue Theme matching Livin */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
            colors={['#0085FF', '#00A3FF', '#F2F2F2']} // Deep blue to lighter blue then fade to white/gray at bottom
            locations={[0, 0.4, 0.4]} // Hard stop for the background
            style={styles.gradientBg}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    {
                        avatar?
                    <Image 
                        source={{ uri: BASE_URL+avatar }} 
                        style={styles.avatar} 
                    /> : 
                    <Image 
                        source={{ uri: 'https://ui-avatars.com/api/?name='+name+'&background=random&color=fff' }} 
                        style={styles.avatar} 
                    />
                    }
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    {/* 
                    sesuaikan text size nama dengan dimension device
                    */}
                    <Text style={styles.userName}>{name}</Text>
                    {cid ? (
                        <TouchableOpacity style={styles.poinContainer}>
                            <Ionicons name="barcode-outline" size={12} color="#e8d4f0ff" style={{ marginRight: 4 }} />
                            <Text style={styles.userPoin}>{cid}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.noServiceLink}
                            onPress={() => navigation.navigate('AddService')}
                        >
                            <Ionicons name="link-outline" size={12} color="#FF9F0A" style={{ marginRight: 4 }} />
                            <Text style={styles.noServiceLinkText}>Tambah Layanan</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={() => navigation.navigate('NotificationsInbox')}
                >
                    <Ionicons name="mail-outline" size={24} color="#6a366aff" />
                    {unreadNotifCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadNotifCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {/* <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={24} color="#6a366aff" />
                </TouchableOpacity> */}
                <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                     <Ionicons name="log-out-outline" size={24} color="#6a366aff" />
                </TouchableOpacity>
            </View>
        </View>

        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
        >
            
            {/* Main Account Card (Rekening Style) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Status Paket</Text>
                    {packageName && invoiceAmount ? (
                      <View style={styles.cardActions}>
                          <TouchableOpacity onPress={handleDownloadTagihan} style={styles.actionLink}>
                               <Text style={styles.actionText}>Download Tagihan</Text>
                               <Ionicons name="download-outline" size={16} color="#6a366aff" style={{marginLeft: 4}} />
                          </TouchableOpacity>
                      </View>
                    ) : null}
                </View>

                {packageName ? (
                  <>
                    {/* Multi-service tab selector — only shown when there are multiple services */}
                    {activeServices.length > 1 && (
                      <ScrollView 
                        ref={serviceTabsRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.serviceTabsScroll}
                        contentContainerStyle={styles.serviceTabsContent}
                      >
                        {activeServices.map((svc, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.serviceTab,
                              selectedServiceIndex === idx && styles.serviceTabActive
                            ]}
                            onPress={() => handleSelectService(idx)}
                          >
                            <Ionicons 
                              name="wifi" 
                              size={12} 
                              color={selectedServiceIndex === idx ? '#fff' : '#673284ff'} 
                              style={{ marginRight: 5 }}
                            />
                            <Text style={[
                              styles.serviceTabText,
                              selectedServiceIndex === idx && styles.serviceTabTextActive
                            ]}>
                              {svc.name || `Layanan ${idx + 1}`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Account Details */}
                    <View style={styles.accountContainer}>

                        <View style={styles.accountInfo}>
                             <Text style={styles.accountName}>{packageName}</Text>
                             <Text style={styles.accountNumber}>ID: {sid}</Text>
                        </View>
                        {
                            packageState === 'Terblokir' ? (
                                <View style={styles.accountStatus}>
                                     <View style={[styles.statusBadge, { backgroundColor: '#F2F2F2' }]}>
                                        <Text style={[styles.statusText, { color: '#FF3B30' }]}>{packageState}</Text>
                                     </View>
                                </View>
                            ) : packageState === 'Belum dibayar' ? (
                                <View style={styles.accountStatus}>
                                     <View style={[styles.statusBadge, { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA', borderWidth: 1 }]}>
                                        <View style={[styles.statusDot, { backgroundColor: '#000000', overflow: 'hidden' }]}>
                                            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B30', opacity: blinkAnim }]} />
                                        </View>
                                        <Text style={[styles.statusText, { color: '#FF3B30' }]}>{packageState}</Text>
                                     </View>
                                </View>
                            ) : packageState === 'Aktif' ? (
                                <View style={styles.accountStatus}>
                                     <View style={[styles.statusBadge, { backgroundColor: '#F2F2F2' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: '#FF9F0A', overflow: 'hidden' }]}>
                                            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#34C759', opacity: blinkAnim }]} />
                                        </View>
                                        <Text style={[styles.statusText, { color: '#34C759' }]}>{packageState}</Text>
                                     </View>
                                </View>
                            ) : packageState === 'Belum aktif' ? (
                                <View style={styles.accountStatus}>
                                     <View style={[styles.statusBadge, { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA', borderWidth: 1 }]}>
                                        <View style={[styles.statusDot, { backgroundColor: '#000000', overflow: 'hidden' }]}>
                                            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B30', opacity: blinkAnim }]} />
                                        </View>
                                        <Text style={[styles.statusText, { color: '#FF3B30' }]}>{packageState}</Text>
                                     </View>
                                </View>
                            ) : null
                        }
                    </View>

                    {/* Bill / Balance */}
                    {invoices.length > 0 ? (
                        <>
                            <View style={styles.billContainer}>
                                <Text style={styles.currency}>Rp</Text>
                                <Text style={styles.billAmount}>
                                    {formatNumberWithCommas(invoiceAmount)}
                                </Text>
                            </View>
                            <View style={styles.billDateContainer}>
                                <Text style={styles.billDate}>*Jatuh Tempo {formatDate(invoiceDueDate)}</Text>
                            </View>
                        </>
                    ) : null}
                    
                    {invoiceAmount ? (
                        <TouchableOpacity onPress={handlePayTagihan} style={styles.payButton}>
                            <Text style={styles.payButtonText}>Bayar Tagihan</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.paidStatusRow}>
                            <View style={styles.paidStatusIcon}>
                                <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                            </View>
                            <Text style={styles.paidStatusText}>Tagihan Lunas</Text>
                            <Text style={styles.paidStatusSub}>Belum ada tagihan</Text>
                        </View>
                    )}
                  </>
                ) : (
                  <View style={styles.noServiceContainer}>
                      <View style={styles.noServiceIcon}>
                          <Ionicons name="alert-circle-outline" size={36} color="#FF9F0A" />
                      </View>
                      <Text style={styles.noServiceText}>Belum Ada Layanan / Tagihan</Text>
                      <Text style={styles.noServiceSubText}>Hubungkan akun Anda dengan ID Pelanggan untuk melihat tagihan bulanan dan status paket Anda.</Text>
                      <TouchableOpacity 
                          style={styles.addServiceBtn}
                          onPress={() => navigation.navigate('AddService')}
                      >
                          <LinearGradient
                              colors={['#673284ff', '#1b060aff']}
                              style={styles.addServiceGradient}
                              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                          >
                              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 6}} />
                              <Text style={styles.addServiceBtnText}>Hubungkan Layanan</Text>
                          </LinearGradient>
                      </TouchableOpacity>
                  </View>
                )}
            </View>

            {/* Menu Grid Card (Transaksi Favorit Style) */}
            <View style={styles.card}>
                 <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Menu Utama</Text>
                    {/* <TouchableOpacity style={styles.actionLink}>
                            <Text style={styles.actionText}>Atur</Text>
                            <Ionicons name="options-outline" size={16} color="#6a366aff" style={{marginLeft: 4}} />
                    </TouchableOpacity> */}
                </View>

                <View style={styles.menuGridWrapper}>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item) => (
                            <TouchableOpacity onPress={item.onPress} key={item.id} style={styles.menuItem}>
                                <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}>
                                    <Ionicons name={item.icon} size={28} color="#FFF" />
                                </View>
                                <Text numberOfLines={2} style={styles.menuTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Promo Section (Kelebihan Layanan) */}
            <View style={[styles.card, styles.lastCard]}>
                <Text style={styles.cardTitle}>Keunggulan Arana</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
                    
                    {/* Card 1: Support 24 Jam */}
                    <TouchableOpacity style={styles.promoCard}>
                        <LinearGradient
                            colors={['#673284ff', '#1b060aff']}
                            style={styles.promoGradient}
                            start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                            <Image 
                                source={require('../../assets/images/support_operator.png')} 
                                style={styles.promoImage} 
                            />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoText}>Support 24 Jam</Text>
                                <Text style={styles.promoSub} numberOfLines={2}>Layanan bantuan siap sedia kapan pun Anda butuhkan.</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Card 2: Paket Pilihan */}
                    <TouchableOpacity style={styles.promoCard}>
                        <LinearGradient
                            colors={['#673284ff', '#1b060aff']}
                            style={styles.promoGradient}
                            start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                            <Image 
                                source={require('../../assets/images/internet_packages.png')} 
                                style={styles.promoImage} 
                            />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoText}>Bebas Pilih Paket</Text>
                                <Text style={styles.promoSub} numberOfLines={2}>Pilihan kecepatan dan harga yang pas untuk setiap rumah.</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Card 3: Koneksi Stabil */}
                    <TouchableOpacity style={styles.promoCard}>
                        <LinearGradient
                            colors={['#673284ff', '#1b060aff']}
                            style={styles.promoGradient}
                            start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                            <Image 
                                source={require('../../assets/images/fast_connection.png')} 
                                style={styles.promoImage} 
                            />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoText}>Koneksi Stabil</Text>
                                <Text style={styles.promoSub} numberOfLines={2}>Streaming, gaming, dan browsing lancar tanpa hambatan.</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2', // Light Gray background for the body
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  avatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      borderWidth: 2,
      borderColor: 'rgba(216, 36, 213, 0.3)',
  },
  userInfo: {
      marginLeft: 12,
  },
  userName: {
      //buatkan fontSize dinamis sesuai dengan lebar device
      fontSize: width * 0.035,
      fontWeight: 'bold',
      color: '#673284ff',
  },
  poinContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#673284ff',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 4,
  },
  userPoin: {
      fontSize: 12,
      color: '#ffffffff',
      marginRight: 4,
      fontWeight: '600',
  },
  noServiceLink: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 159, 10, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 159, 10, 0.4)',
  },
  noServiceLinkText: {
      fontSize: 11,
      color: '#FF9F0A',
      fontWeight: '700',
  },
  headerRight: {
      flexDirection: 'row',
  },
  iconButton: {
      marginLeft: 15,
      position: 'relative',
  },
  badge: {
      position: 'absolute',
      top: -4,
      right: -8,
      minWidth: 16,
      minHeight: 16,
      borderRadius: 8,
      backgroundColor: '#FF3B30',
      borderWidth: 1.5,
      borderColor: '#0085FF',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
  },
  badgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: 'bold',
  },
  scrollView: {
      flex: 1,
  },
  scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 50,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 4,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1C1C1E',
  },
  cardActions: {
      flexDirection: 'row',
  },
  actionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
  },
  actionText: {
      fontSize: 14,
      color: '#673284ff',
      fontWeight: '600',
  },
  accountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountName: {
      fontSize: 13,
      color: '#3A3A3C',
      marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#8E8E93',
  },
  accountInfo: {
    flex: 1,
  },
  accountStatus: {
    alignItems: 'center',
    marginLeft: 8, // gap between CID and status badge
    marginTop: 0,
  },
  statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8F5E9',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
  },
  statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ed1215ff',
      marginRight: 6,
  },
  statusText: {
      color: '#34C759',
      fontSize: 12,
      fontWeight: 'bold',
  },
  billContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
  },
  currency: {
      fontSize: 16,
      color: '#1C1C1E',
      fontWeight: '600',
      marginTop: 4,
      marginRight: 4,
  },
  billAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1C1C1E',
      letterSpacing: 0.5,
  },
  billDate: {      
      marginLeft: 4,      
      marginRight: 4,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontSize: 12,
      color: '#ef1818ff',
      marginTop: -15
  },
  billDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 0,
  },
  payButton: {
      paddingVertical: 12,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#F2F2F2',
      marginTop: 5,
  },
  payButtonText: {
      color: '#0a36e5a5',
      fontSize: 16,      
      fontWeight: 'bold',
  },
  paidStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: '#F2F2F2',
      marginTop: 5,
  },
  paidStatusIcon: {
      marginRight: 8,
  },
  paidStatusText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#34C759',
      marginRight: 8,
  },
  paidStatusSub: {
      fontSize: 12,
      color: '#8E8E93',
      flex: 1,
  },
  serviceTabsScroll: {
      marginBottom: 14,
  },
  serviceTabsContent: {
      flexDirection: 'row',
      paddingRight: 4,
  },
  serviceTab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#673284ff',
      marginRight: 8,
      backgroundColor: 'transparent',
  },
  serviceTabActive: {
      backgroundColor: '#673284ff',
      borderColor: '#673284ff',
  },
  serviceTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#673284ff',
  },
  serviceTabTextActive: {
      color: '#fff',
  },
  noServiceContainer: {
      alignItems: 'center',
      paddingVertical: 15,
  },
  noServiceIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FFF5E5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  noServiceText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1C1C1E',
      marginBottom: 8,
  },
  noServiceSubText: {
      fontSize: 13,
      color: '#8E8E93',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      paddingHorizontal: 15,
  },
  addServiceBtn: {
      width: '100%',
      borderRadius: 12,
      overflow: 'hidden',
  },
  addServiceGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
  },
  addServiceBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold',
  },
  menuGridWrapper: {
      alignItems: 'center', // Center the grid container to elegantly handle small number of items
      marginTop: 15,
  },
  menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      width: '100%',
      paddingHorizontal: 5,
  },
  menuItem: {
      width: '33.33%', // 3 items per row, optimal layout for 6 items (2 rows perfectly balanced)
      alignItems: 'center',
      marginBottom: 20,
  },
  menuIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#f6f2f9', // Light purple background to match app theme
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
  },
  menuTitle: {
      fontSize: 11,
      color: '#3A3A3C',
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: 4,
  },
  lastCard: {
      marginBottom: 100, // Space for bottom tabs
  },
  promoScroll: {
      marginTop: 10,
      marginHorizontal: -20, // To allow full bleed scrolling within card padding
      paddingHorizontal: 20,
  },
  promoCard: {
      width: 250,
      height: 120,
      borderRadius: 15,
      marginRight: 15,
      overflow: 'hidden',
  },
  promoGradient: {
      flex: 1,
      justifyContent: 'flex-end',
      position: 'relative',
  },
  promoImage: {
      position: 'absolute',
      right: -20,
      bottom: -10,
      width: 140,
      height: 140,
      opacity: 0.35, // Decreased opacity significantly to make the background darker
      resizeMode: 'contain',
  },
  promoTextContainer: {
      padding: 16,
      width: '75%', // allows a bit more room for text
      zIndex: 1,
  },
  promoText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: 'bold',
      marginBottom: 3,
      textShadowColor: 'rgba(0, 0, 0, 0.75)', // Added text shadow for legibility
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
  },
  promoSub: {
      color: '#eefeef',
      fontSize: 12,
      lineHeight: 16,
      textShadowColor: 'rgba(0, 0, 0, 0.65)', // Added text shadow for legibility
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
});

export default Dashboard;
