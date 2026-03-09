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
  Animated,
  Alert
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

const MyInvoices = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [payLoading, setPayLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [idUser, setIdUser] = useState(null);
    const [invoices, setInvoices] = useState([]);

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

    const getInvoices = useCallback((userId) => {
        setLoading(true);
        const urlpath = `customers/${COMPANY_ID}/${MODE}/user_profile/${userId}/invoices`;
        const invoicesRef = ref(db, urlpath);
        onValue(invoicesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // If it's an object, convert to array just in case, otherwise set directly if array
                let invoicesArray = Array.isArray(data) ? data : Object.values(data);
                // Assume we want the newest invoices first (simple reverse)
                invoicesArray = invoicesArray.reverse();
                setInvoices(invoicesArray);
            } else {
                setInvoices([]);
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
            getInvoices(idUser);
        }
    }, [idUser, getInvoices]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        if (idUser) {
            getInvoices(idUser);
        } else {
            setRefreshing(false);
        }
    }, [idUser, getInvoices]);

    const formatNumberWithCommas = (number) => {
        if (!number) return '0';
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handlePayInvoice = async (invoiceId) => {
        if (!invoiceId) {
            Alert.alert('Informasi', 'ID Tagihan tidak ditemukan.');
            return;
        }

        setPayLoading(true);
        try {
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

            if (response.ok && data?.data?.redirect_url) {
                const redirect_url = data.data.redirect_url;
                navigation.navigate('SnapPayment', { url: redirect_url });
            } else {
                Alert.alert('Gagal', data?.message || 'Terjadi kesalahan sistem saat menghubungi payment gateway.');
            }
        } catch (error) {
            console.error("Payment error: ", error);
            Alert.alert('Error', 'Terjadi kesalahan saat memproses pembayaran.');
        } finally {
            setPayLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={['#0085FF', '#00A3FF', '#F2F2F2']}
                    locations={[0, 0.4, 0.4]} 
                    style={styles.gradientBg}
                />
            </View>

            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#673284ff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tagihan Saya</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0085FF"]} tintColor={"#fff"} />
                    }
                >
                    {(loading || payLoading) && !refreshing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFF" />
                        </View>
                    ) : invoices.length > 0 ? (
                        <View style={styles.invoiceList}>
                            {invoices.map((invoice, index) => {
                                // Defaulting invoice_status to logic based on your system (e.g. Unpaid/Paid)
                                const isPaid = invoice?.invoice_status?.toLowerCase() === 'paid' || invoice?.status?.toLowerCase() === 'paid';
                                const invoiceId = invoice.id || invoice.invoice_id; // Check fields from firebase
                                
                                return (
                                    <View key={index} style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.invoiceIconContainer}>
                                                <Ionicons name="receipt-outline" size={24} color="#0085FF" />
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: isPaid ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)' }]}>
                                                <Text style={[styles.statusText, { color: isPaid ? '#34C759' : '#FF3B30' }]}>
                                                    {isPaid ? 'Lunas' : 'Belum Dibayar'}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.accountContainer}>
                                            <View style={styles.accountInfo}>
                                                <Text style={styles.accountName}>{invoice.invoice_number || `INV-${index+1}`}</Text>
                                                <Text style={styles.accountNumber}>Tanggal: {invoice.invoice_date || '-'}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.serviceDetails}>
                                            <View style={styles.detailItem}>
                                                <Text style={styles.detailLabel}>Total Tagihan</Text>
                                                <Text style={styles.detailValue}>Rp {formatNumberWithCommas(invoice.invoice_amount || invoice.invoice_total || 0)}</Text>
                                            </View>
                                        </View>

                                        {!isPaid && (
                                            <TouchableOpacity 
                                                style={styles.payBtn}
                                                onPress={() => handlePayInvoice(invoiceId)}
                                            >
                                                <LinearGradient
                                                    colors={['#0085FF', '#00A3FF']}
                                                    style={styles.payGradient}
                                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                                >
                                                    <Ionicons name="wallet-outline" size={20} color="#fff" style={{marginRight: 6}} />
                                                    <Text style={styles.payBtnText}>Bayar Sekarang</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.card, styles.noDataCard]}>
                            <View style={styles.noDataIcon}>
                                <Ionicons name="checkmark-done-circle-outline" size={60} color="#34C759" />
                            </View>
                            <Text style={styles.noDataText}>Tidak Ada Tagihan</Text>
                            <Text style={styles.noDataSubText}>Hore! Semua layanan Anda saat ini sudah dibayar. Saat ini Anda tidak memiliki tagihan.</Text>
                        </View>
                    )}

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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',        
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#673284ff',
    },  
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 14,
        paddingBottom: 20,
    },
    loadingContainer: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    invoiceList: {
        marginTop: 4,
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
    invoiceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 133, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
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
        fontSize: 16,
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
        marginBottom: 10,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    payBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
        marginTop: 10,
    },
    payGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    payBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noDataCard: {
        alignItems: 'center',
        paddingVertical: 40,
        marginTop: 10,
    },
    noDataIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    noDataText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    noDataSubText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        paddingHorizontal: 10,
        lineHeight: 20,
    },
});

export default MyInvoices;