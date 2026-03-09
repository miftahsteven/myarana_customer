import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  Modal, ActivityIndicator, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database"; 
import { 
  COMPANY_ID, MODE, 
  FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, 
  FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, 
  FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID 
} from '@env';
import * as SecureStore from 'expo-secure-store';

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

const { width, height } = Dimensions.get('window');

const NotificationsInbox = ({ navigation }) => {
    const [idUser, setIdUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const userData = await SecureStore.getItemAsync('userData');
            if (userData) {
                setIdUser(JSON.parse(userData).userLoggedIn.id);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (!idUser) return;

        const notifPath = `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}/notifications`;
        const notifRef = ref(db, notifPath);

        const unsubscribe = onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const listData = data.list || {};
                const count = data.unread || 0;
                
                // Convert object to array and sort by created_at descending
                const formattedList = Object.keys(listData).map(key => ({
                    id: key,
                    ...listData[key]
                })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setNotifications(formattedList);
                setUnreadCount(count);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [idUser]);

    const handleReadNotification = async (item) => {
        // If unread, mark it as read in Firebase
        if (!item.is_read && idUser) {
            const specificNotifRef = ref(db, `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}/notifications/list/${item.id}`);
            const unreadRef = ref(db, `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}/notifications`);
            
            // Note: usually you'd want to decrement `unread` count via cloud function or transaction, 
            // but we can just update is_read here and let the backend (or another logic) handle the unread count update if needed.
            // For simple client side:
            update(specificNotifRef, { is_read: true });
            
            if(unreadCount > 0){
                 update(unreadRef, { unread: unreadCount - 1 });
            }

            // Panggil API Backend
            try {
                const token = await SecureStore.getItemAsync('token');
                if (token) {
                    const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
                    const BASE_URL = API_CONFIG === 'DEV'
                      ? process.env.EXPO_PUBLIC_API_DEV_URL
                      : process.env.EXPO_PUBLIC_API_URL;

                    const readit = await fetch(`${BASE_URL}/users/notification/detail/${item.notification_id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    //console.log("Baca Ini", item.notification_id);
                    
                }
            } catch (err) {
                console.error('Failed to notify backend about read notification:', err);
            }
        }
        
        setSelectedNotif(item);
        setModalVisible(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const monthIndex = date.getMonth();
        const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
        
        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ];
        
        return `${day}/${monthNames[monthIndex]}/${year}`;
    };

    const renderItem = ({ item }) => {
        const isUnread = !item.is_read;
        
        return (
            <TouchableOpacity 
                style={[styles.notifCard, isUnread && styles.notifCardUnread]} 
                onPress={() => handleReadNotification(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, isUnread ? styles.iconContainerUnread : styles.iconContainerRead]}>
                    <Ionicons 
                        name={isUnread ? "notifications" : "notifications-outline"} 
                        size={24} 
                        color={isUnread ? "#FFF" : "#6a366aff"} 
                    />
                </View>
                
                <View style={styles.contentContainer}>
                    <View style={styles.topRow}>
                        <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
                            {item.title || 'Notifikasi'}
                        </Text>
                        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    </View>
                    <Text style={styles.description} numberOfLines={2}>
                        {item.description || ''}
                    </Text>
                </View>

                {isUnread && <View style={styles.unreadIndicator} />}
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#D1D1D6" />
            <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
            <Text style={styles.emptySub}>Semua pemberitahuan penting akan muncul di sini.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Inbox</Text>
                    {unreadCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#673284ff" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={notifications.length === 0 ? styles.flatListEmpty : styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={EmptyState}
                />
            )}

            {/* Modal for viewing notification */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>

                        <View style={styles.modalIconContainer}>
                             <Ionicons name="notifications" size={32} color="#FFF" />
                        </View>

                        <Text style={styles.modalDate}>{selectedNotif ? formatDate(selectedNotif.created_at) : ''}</Text>
                        <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
                        
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalDescription}>{selectedNotif?.description}</Text>
                        </ScrollView>

                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <LinearGradient
                                colors={['#673284ff', '#321045']}
                                style={styles.modalGradientButton}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.modalButtonText}>Tutup</Text>
                            </LinearGradient>
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
        backgroundColor: '#F8F9FA',
    },
    headerTop: { 
        flexDirection: 'row', 
        width: '100%', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        paddingBottom: 15, 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F2'
    },
    backButton: { 
        padding: 8, 
        backgroundColor: '#F2F2F2', 
        borderRadius: 20, 
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#1C1C1E' 
    },
    headerBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    headerBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 15,
        paddingBottom: 40,
    },
    flatListEmpty: {
        flex: 1,
        justifyContent: 'center',
    },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#F2F2F2',
        position: 'relative',
    },
    notifCardUnread: {
        backgroundColor: '#FAEDFF',
        borderColor: 'rgba(103, 50, 132, 0.2)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconContainerRead: {
        backgroundColor: '#F2F2F2',
    },
    iconContainerUnread: {
        backgroundColor: '#673284ff',
        shadowColor: '#673284ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3A3A3C',
        flex: 1,
        marginRight: 8,
    },
    titleUnread: {
        fontWeight: 'bold',
        color: '#1C1C1E',
    },
    date: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    description: {
        fontSize: 13,
        color: '#6C6C70',
        lineHeight: 18,
    },
    unreadIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3A3A3C',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        width: '100%',
        maxHeight: height * 0.7,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: '#F2F2F2',
        borderRadius: 20,
        zIndex: 2,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#673284ff',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#673284ff',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalDate: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalScroll: {
        width: '100%',
        marginBottom: 24,
    },
    modalDescription: {
        fontSize: 14,
        color: '#3A3A3C',
        lineHeight: 22,
        textAlign: 'center',
    },
    modalButton: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
    },
    modalGradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default NotificationsInbox;
