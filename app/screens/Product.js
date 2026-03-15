import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
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

const Product = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProductFromFb = () => {
    const urlpath = `customers/${COMPANY_ID}/${MODE}/products`;    
    const productRef = ref(db, urlpath);
    
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        productList.sort((a, b) => {
          if(b.created_at && a.created_at) return new Date(b.created_at) - new Date(a.created_at);
          return String(a.id).localeCompare(String(b.id)); // Default order
        });
        setProducts(productList);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    getProductFromFb();
  }, []); 

  const getImageUrl = (imagePath) => {
      if (!imagePath) return 'https://ui-avatars.com/api/?name=Product&background=random&color=fff';
      if (imagePath.startsWith('http')) return imagePath;

      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV' 
          ? process.env.EXPO_PUBLIC_API_DEV_URL 
          : process.env.EXPO_PUBLIC_API_URL;

      // Handle cases where the base URL already has a trailing slash or the imagePath has a leading slash
      const cleanBase = BASE_URL ? BASE_URL.replace(/\/$/, '') : EXPO_PUBLIC_API_DEV_URL;
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${cleanBase}${cleanPath}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#673284ff" />
      
      {/* Custom Header matching the Arana brand */}
      <LinearGradient
          colors={['#673284ff', '#1b060aff']}
          style={styles.headerGradient}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
      >
          <SafeAreaView>
              <View style={styles.headerContent}>
                  {/* Assuming Product is a top-level tab, you might not need a back button, but we include it just in case */}
                  <View style={styles.headerTextContainer}>
                      <Text style={styles.headerTitle}>Layanan Internet</Text>
                      <Text style={styles.headerSubtitle}>Temukan paket internet terbaik untuk Anda</Text>
                  </View>
                  <Ionicons name="cube-outline" size={26} color="#FFF" style={styles.headerIcon} />
              </View>
          </SafeAreaView>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {loading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#673284ff" />
                <Text style={styles.loadingText}>Memuat Produk...</Text>
            </View>
        ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color="#D1D1D6" style={{ marginBottom: 15 }} />
                <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
                <Text style={styles.emptyText}>Produk dan paket layanan belum tersedia saat ini.</Text>
            </View>
        ) : (
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Paket Unggulan</Text>
                
                {products.map((item, index) => (
                    <TouchableOpacity activeOpacity={0.9} key={item.id || index} style={styles.productCard}>
                        <View style={styles.productImageContainer}>
                            <Image 
                                source={{ uri: getImageUrl(item.image) }} 
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                            {/* Decorative Badge */}
                            <LinearGradient
                                colors={['#FF9F0A', '#FF3B30']}
                                style={styles.badge}
                                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                            >
                                <Ionicons name="star" size={10} color="#FFF" style={{marginRight: 3}} />
                                <Text style={styles.badgeText}>Terpopuler</Text>
                            </LinearGradient>
                        </View>
                        
                        <View style={styles.productInfo}>
                            <View style={styles.productHeadline}>
                                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                            </View>
                            
                            <Text style={styles.productDescription} numberOfLines={3}>
                                {item.description || 'Nikmati layanan internet cepat dan stabil tanpa batas untuk menemani aktivitas harian keluarga Anda.'}
                            </Text>

                            {/* <View style={styles.productFooter}>
                                <TouchableOpacity style={styles.buyButton}>
                                    <Text style={styles.buyButtonText}>Pilih Paket</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View> */}
                        </View>
                    </TouchableOpacity>
                ))}
                
                <View style={styles.bottomPadding} />
            </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#673284ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIcon: {
    marginLeft: 15,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    marginTop: -15, // Slide under the rounded header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 35, // account for negative margin overlapping
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    marginLeft: 2,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 20,
  },
  productHeadline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#673284ff',
    marginRight: 10,
    lineHeight: 24,
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#673284ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  bottomPadding: {
    height: 40,
  }
});

export default Product;
