import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Image, Dimensions, StatusBar as RNStatusBar, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, off, set } from "firebase/database"; // ADD 
import { COMPANY_ID, MODE, EXPO_PUBLIC_API_DEV_URL } from '@env';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';

const firebaseConfig = {
  apiKey: "AIzaSyDLHLa9fFXErUgihSe9rslTCh5iRJZDoEM",
  authDomain: "myarana-customer.firebaseapp.com",
  databaseURL: "https://myarana-customer-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myarana-customer",
  storageBucket: "myarana-customer.firebasestorage.app",
  messagingSenderId: "165261987152",
  appId: "1:165261987152:web:6a628a9c9b6ddeb6a33055",
  measurementId: "G-MRX9YY19RS"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);


const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  // Blinking animation for status dot
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [profile, setProfile] = React.useState({});
  const [name, setName] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [idUser, setIdUser] = React.useState(null);
  const [packageName, setPackageName] = React.useState(null);
  const [packagePrice, setPackagePrice] = React.useState(null);
  const [packageState, setPackageState] = React.useState(null);
  const [cid, setCid] = React.useState(null);
  const [invoice, setInvoice] = React.useState(null);
  const [invoices, setInvoices] = React.useState([]);
  const [invoiceId, setInvoiceId] = React.useState(null);
  const [invoiceState, setInvoiceState] = React.useState(null);
  const [invoiceDate, setInvoiceDate] = React.useState(null);   
  const [invoiceAmount, setInvoiceAmount] = React.useState(null);
  const [invoiceDueDate, setInvoiceDueDate] = React.useState(null); 
  const { logout } = useAuth();

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
        setPackageName(data.activeServices[0].name);
        setPackagePrice(data.activeServices[0].monthly_charge);
        setPackageState(data.activeServices[0].state);
        setName(data.identity.detailUser.complete_name);
        setAvatar(data.identity.detailUser.avatar);
        setInvoice(data.invoices[0].invoice);
        setInvoices(data.invoices);
        setInvoiceId(data.invoices[0].invoice.invoice_id);
        setInvoiceState(data.invoices[0].detail[0]);        
        setInvoiceAmount(data.invoices[0].invoice.invoice_total);
        setInvoiceDueDate(data.invoices[0].invoice.invoice_due_date);
        setCid(data.customerIdentity.cid);
      }
    });
  }

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

  // Menu Grid Data
  const menuItems = [
    { id: 1, title: 'Tagihan', icon: 'receipt-outline', library: 'Ionicons', color: '#fff', bg: '#00A3FF' },
    { id: 2, title: 'History Transaksi', icon: 'history', library: 'MaterialCommunityIcons', color: '#fff', bg: '#FF9F0A' }, // Warning orange
    { id: 3, title: 'Tiket', icon: 'ticket-confirmation', library: 'MaterialCommunityIcons', color: '#fff', bg: '#30D158' }, // Success green
    { id: 4, title: 'Ubah Paket', icon: 'cube', library: 'Ionicons', color: '#fff', bg: '#BF5AF2' }, // Purple
    { id: 5, title: 'Speedtest', icon: 'speedometer', library: 'MaterialCommunityIcons', color: '#fff', bg: '#FF453A' }, // Red
    { id: 6, title: 'Info', icon: 'information-outline', library: 'MaterialCommunityIcons', color: '#fff', bg: '#64D2FF' }, // Light Blue
    { id: 7, title: 'Video', icon: 'play-circle', library: 'Ionicons', color: '#fff', bg: '#FF375F' }, // Pink
    { id: 8, title: 'Lainnya', icon: 'grid', library: 'Ionicons', color: '#fff', bg: '#8E8E93' }, // Gray
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
    // Ensuring consistent sizing
    const ICON_SIZE = 24;
    if (item.library === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={item.icon} size={ICON_SIZE} color={item.color} />;
    if (item.library === 'MaterialIcons') return <MaterialCommunityIcons name={item.icon} size={ICON_SIZE} color={item.color} />; 
    return <Ionicons name={item.icon} size={ICON_SIZE} color={item.color} />;
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
      
      if (response.ok) {
        const fileUri = `${FileSystem.documentDirectory}Tagihan_${invoiceId}.pdf`;
        const downloadResult = await FileSystem.downloadAsync(
          `${BASE_URL}/invoices/export_pdf/${invoiceId}`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log(downloadResult);

        if (downloadResult.status === 200) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Bagikan Tagihan',
          });
        } else {
          Alert.alert('Gagal', 'Gagal mengunduh tagihan.');
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
                        source={{ uri: EXPO_PUBLIC_API_DEV_URL+avatar }} 
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
                    <TouchableOpacity style={styles.poinContainer}>
                        <Text style={styles.userPoin}>976 arana poin</Text>
                        <Ionicons name="chevron-forward" size={12} color="#efebefff" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="mail-outline" size={24} color="#6a366aff" />
                    <View style={styles.badge} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={24} color="#6a366aff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
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
                    <View style={styles.cardActions}>
                        {/* <TouchableOpacity style={styles.actionLink}>
                            <Text style={styles.actionText}>Detail</Text>
                            <Ionicons name="eye-off-outline" size={16} color="#6a366aff" style={{marginLeft: 4}} />
                        </TouchableOpacity> */}
                        <TouchableOpacity onPress={handleDownloadTagihan} style={styles.actionLink}>
                             <Text style={styles.actionText}>Download Tagihan</Text>
                             <Ionicons name="download-outline" size={16} color="#6a366aff" style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Details */}
                <View style={styles.accountContainer}>
                    <View style={styles.accountInfo}>
                         <Text style={styles.accountName}>{packageName}</Text>
                         <Text style={styles.accountNumber}>ID: {cid}</Text>
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
                
                <TouchableOpacity style={styles.payButton}>
                    <Text style={styles.payButtonText}>Bayar Tagihan</Text>
                </TouchableOpacity>
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

                <View style={styles.menuGrid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.menuItem}>
                            <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                                {renderIcon(item)}
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Promo Section (Spesial Untuk Anda) */}
            <View style={[styles.card, styles.lastCard]}>
                <Text style={styles.cardTitle}>Spesial Untuk Anda</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
                    {[1, 2, 3].map((i) => (
                        <TouchableOpacity key={i} style={styles.promoCard}>
                            <LinearGradient
                                colors={['#673284ff', '#1b060aff']}
                                style={styles.promoGradient}
                                start={{x:0, y:0}} end={{x:1, y:1}}
                            >
                                <Text style={styles.promoText}>Promo {i}</Text>
                                <Text style={styles.promoSub}>Diskon 50%!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
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
  headerRight: {
      flexDirection: 'row',
  },
  iconButton: {
      marginLeft: 15,
      position: 'relative',
  },
  badge: {
      position: 'absolute',
      top: 0,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
      borderWidth: 1.5,
      borderColor: '#0085FF',
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
  menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
  },
  menuItem: {
      width: '23%', 
      alignItems: 'center',
      marginBottom: 20,
  },
  iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      // Create that soft glowing feel or just solid color
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  menuTitle: {
      fontSize: 12,
      color: '#3A3A3C',
      textAlign: 'center',
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
      padding: 16,
      justifyContent: 'flex-end',
  },
  promoText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  promoSub: {
      color: '#fff',
      opacity: 0.9,
  },
});

export default Dashboard;
