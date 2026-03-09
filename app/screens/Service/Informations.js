import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { 
  COMPANY_ID, MODE,
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


const Informations = ({ navigation }) => {
    const [informations, setInformations] = useState([]);
    const [loading, setLoading] = useState(true);

    const getInformations = () => {
        const urlpath = `customers/${COMPANY_ID}/${MODE}/informations`;    
        const infoRef = ref(db, urlpath);
        
        onValue(infoRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert to array and sort by latest ID/date
                const infoList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                infoList.sort((a, b) => {
                   if(b.created_at && a.created_at) return new Date(b.created_at) - new Date(a.created_at);
                   return String(b.id).localeCompare(String(a.id));
                });
                setInformations(infoList);
            } else {
                setInformations([]);
            }
            setLoading(false);
        });
    }

    useEffect(() => {
        getInformations();
    }, []); 

    const formatDate = (dateString) => {
        if(!dateString) return '';
        const date = new Date(dateString);
        if(isNaN(date.getTime())) return dateString; // fallback
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    const getIconInfo = (type, title) => {
        const lowerStr = (type || title || '').toLowerCase();
        if (lowerStr.includes('gangguan') || lowerStr.includes('maintenance')) return { name: 'warning', color: '#FF3B30', bgColor: '#FFE5E5' };
        if (lowerStr.includes('promo') || lowerStr.includes('diskon')) return { name: 'megaphone', color: '#ff9500', bgColor: '#FFF2E5' };
        if (lowerStr.includes('update') || lowerStr.includes('pembaruan')) return { name: 'sync-circle', color: '#34C759', bgColor: '#E8F5E9' };
        return { name: 'information-circle', color: '#673284ff', bgColor: '#F4E5FA' };
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
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
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* Header with Image and Gradient Overlay */}
            <ImageBackground 
                source={require('../../../assets/images/info_header_bg.png')} 
                style={styles.headerBackground}
                imageStyle={{ opacity: 0.4 }}
            >
                <LinearGradient
                    colors={['rgba(103, 50, 132, 0.95)', 'rgba(27, 6, 10, 0.95)']}
                    style={styles.headerGradient}
                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                >
                    <SafeAreaView>
                        <View style={styles.headerContent}>
                            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Pusat Informasi</Text>
                                <Text style={styles.headerSubtitle}>Berita & Update Layanan Arana</Text>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#673284ff" />
                        <Text style={styles.loadingText}>Memuat Informasi...</Text>
                    </View>
                ) : informations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBackground}>
                            <Ionicons name="notifications-off-outline" size={54} color="#673284ff" />
                        </View>
                        <Text style={styles.emptyTitle}>Kosong</Text>
                        <Text style={styles.emptyText}>Belum ada informasi gangguan atau promo terbaru saat ini.</Text>
                    </View>
                ) : (
                    <ScrollView 
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {informations.map((item, index) => {
                            const iconProps = getIconInfo(item.type, item.title);
                            return (
                                <View key={item.id || index} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconContainer, { backgroundColor: iconProps.bgColor }]}>
                                            <Ionicons name={iconProps.name} size={24} color={iconProps.color} />
                                        </View>
                                        <View style={styles.titleContainer}>
                                            <Text style={styles.cardTitle}>{item.title || 'Pengumuman'}</Text>
                                            <Text style={styles.cardDate}>{formatDate(item.created_at || item.time || item.date) || 'Baru Saja'}</Text>
                                        </View>
                                    </View>
                                    
                                    {item.image ? (
                                        <Image 
                                            source={{ uri: getImageUrl(item.image) }} 
                                            style={styles.cardCoverImage} 
                                            resizeMode="cover"
                                        />
                                    ) : null}

                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardContent}>{item.content || item.description || item.message || ''}</Text>
                                    </View>
                                </View>
                            );
                        })}
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
    headerBackground: {
        width: '100%',
        minHeight: Platform.OS === 'ios' ? 140 : 150,
        backgroundColor: '#1b060aff', // Fallback color
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 25,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
        padding: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.75)',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#F4F4F8',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        paddingTop: 10,
        overflow: 'hidden', // to maintain border radius corners over scroll
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#8E8E93',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -50,
    },
    emptyIconBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F4E5FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        paddingBottom: 16,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 6,
        lineHeight: 22,
    },
    cardDate: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    cardCoverImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#F5F5F5',
    },
    cardBody: {
        paddingTop: 0,
    },
    cardContent: {
        fontSize: 14,
        color: '#4A4A4C',
        lineHeight: 23,
    },
});

export default Informations;
