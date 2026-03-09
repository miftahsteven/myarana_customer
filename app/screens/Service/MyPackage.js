import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
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

const { width } = Dimensions.get('window');

const MyPackage = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [idUser, setIdUser] = useState(null);
  const [activeServices, setActiveServices] = useState([]);

  // Blinking animation for 'Belum dibayar' status
  const blinkAnim = React.useRef(new Animated.Value(1)).current;

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
    const fetchUserData = async () => {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        setIdUser(JSON.parse(userData).userLoggedIn.id);
      } else {
          setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getActivePackages = useCallback((userId) => {
    setLoading(true);
    const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${userId}/activeServices`;    
    const servicesRef = ref(db, urlpath);
    
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
          // If it's an object, convert to array just in case, otherwise set directly if array
          const servicesArray = Array.isArray(data) ? data : Object.values(data);
          setActiveServices(servicesArray);
      } else {
          setActiveServices([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
        console.error("Firebase fetch error:", error);
        setLoading(false);
        setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    if (idUser) {
      getActivePackages(idUser);
    }
  }, [idUser, getActivePackages]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (idUser) {
      getActivePackages(idUser);
    } else {
        setRefreshing(false);
    }
  }, [idUser, getActivePackages]);

  const formatNumberWithCommas = (number) => {
    if (!number) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderStatusBadge = (state) => {
      if (state === 'Terblokir') {
          return (
              <View style={[styles.statusBadge, { backgroundColor: '#F2F2F2' }]}>
                  <Text style={[styles.statusText, { color: '#FF3B30' }]}>{state}</Text>
              </View>
          );
      } else if (state === 'Belum dibayar') {
          return (
              <View style={[styles.statusBadge, { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA', borderWidth: 1 }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#000000', overflow: 'hidden' }]}>
                      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B30', opacity: blinkAnim }]} />
                  </View>
                  <Text style={[styles.statusText, { color: '#FF3B30' }]}>{state}</Text>
              </View>
          );
      } else {
          // Default to Aktif style
          return (
              <View style={[styles.statusBadge, { backgroundColor: '#F2F2F2' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#FF9F0A', overflow: 'hidden' }]}>
                      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#34C759', opacity: blinkAnim }]} />
                  </View>
                  <Text style={[styles.statusText, { color: '#34C759' }]}>{state || 'Aktif'}</Text>
              </View>
          );
      }
  };

  return (
    <View style={styles.container}>
      {/* Background - Blue Theme matching Livin */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
            colors={['#0085FF', '#00A3FF', '#F2F2F2']}
            locations={[0, 0.4, 0.4]} 
            style={styles.gradientBg}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Daftar Layanan</Text>
        </View>

        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0085FF"]} tintColor={"#fff"} />
            }
        >
            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            ) : activeServices.length > 0 ? (
                activeServices.map((service, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.serviceIconContainer}>
                                <Ionicons name="cube-outline" size={24} color="#673284ff" />
                            </View>
                            <View style={styles.cardHeaderRight}>
                                {renderStatusBadge(service.state)}
                            </View>
                        </View>
                        
                        <View style={styles.accountContainer}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>{service.name || 'Paket Internet'}</Text>
                                <Text style={styles.accountNumber}>ID Pelanggan: {service.sid || '-'}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.serviceDetails}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Biaya Bulanan</Text>
                                <Text style={styles.detailValue}>Rp {formatNumberWithCommas(service.monthly_charge)}</Text>
                            </View>
                        </View>
                    </View>
                ))
            ) : (
                <View style={[styles.card, styles.noServiceCard]}>
                    <View style={styles.noServiceIcon}>
                        <Ionicons name="folder-open-outline" size={48} color="#FF9F0A" />
                    </View>
                    <Text style={styles.noServiceText}>Belum Ada Layanan / Paket</Text>
                    <Text style={styles.noServiceSubText}>Hubungkan telepon Anda dengan ID Pelanggan untuk melihat layanan yang sedang aktif.</Text>
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

            {/* Spacer for bottom tabs */}
            <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
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
  headerTop: { 
      paddingHorizontal: 20, 
      paddingTop: 70, 
      paddingBottom: 20, 
      justifyContent: 'center', 
      alignItems: 'center', 
  },
  headerTitle: { 
      fontSize: 20, 
      fontWeight: 'bold', 
      color: '#673284ff' 
  },
  scrollView: {
      flex: 1,
  },
  scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 20,
  },
  loaderContainer: {
      marginTop: 50,
      alignItems: 'center',
      justifyContent: 'center',
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
  serviceIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(103, 50, 132, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  cardHeaderRight: {
      flexDirection: 'row',
  },
  statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
  },
  statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
  },
  statusText: {
      fontSize: 12,
      fontWeight: 'bold',
  },
  accountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  accountInfo: {
      flex: 1,
  },
  accountName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1C1C1E',
      marginBottom: 4,
  },
  accountNumber: {
      fontSize: 14,
      color: '#8E8E93',
      fontWeight: '500',
  },
  divider: {
      height: 1,
      backgroundColor: '#F2F2F2',
      marginBottom: 16,
  },
  serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  detailItem: {
      flex: 1,
  },
  detailLabel: {
      fontSize: 12,
      color: '#8E8E93',
      marginBottom: 4,
      fontWeight: '600',
  },
  detailValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  },
  noServiceCard: {
      alignItems: 'center',
      paddingVertical: 40,
  },
  noServiceIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 159, 10, 0.1)',
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
      fontSize: 14,
      color: '#8E8E93',
      textAlign: 'center',
      paddingHorizontal: 10,
      marginBottom: 20,
      lineHeight: 20,
  },
  addServiceBtn: {
      borderRadius: 12,
      overflow: 'hidden',
      width: '100%',
  },
  addServiceGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
  },
  addServiceBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: 'bold',
  },
});

export default MyPackage;
