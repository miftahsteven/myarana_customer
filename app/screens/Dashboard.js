import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar as RNStatusBar, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  // Blinking animation for status dot
  const blinkAnim = useRef(new Animated.Value(1)).current;

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

  const renderIcon = (item) => {
    // Ensuring consistent sizing
    const ICON_SIZE = 24;
    if (item.library === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={item.icon} size={ICON_SIZE} color={item.color} />;
    if (item.library === 'MaterialIcons') return <MaterialCommunityIcons name={item.icon} size={ICON_SIZE} color={item.color} />; 
    return <Ionicons name={item.icon} size={ICON_SIZE} color={item.color} />;
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
                    <Image 
                        source={{ uri: 'https://ui-avatars.com/api/?name=Steve+Job&background=random&color=fff' }} 
                        style={styles.avatar} 
                    />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>Steve</Text>
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
                        <TouchableOpacity style={styles.actionLink}>
                             <Text style={styles.actionText}>Download Tagihan</Text>
                             <Ionicons name="download-outline" size={16} color="#6a366aff" style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Details */}
                <View style={styles.accountContainer}>
                    <View style={styles.accountInfo}>
                         <Text style={styles.accountName}>Arana Fiber Home</Text>
                         <Text style={styles.accountNumber}>ID: 123456789</Text>
                    </View>
                    <View style={styles.accountStatus}>
                         <View style={styles.statusBadge}>
                             <Animated.View style={[styles.statusDot, { opacity: blinkAnim }]} />
                             <Text style={styles.statusText}>Aktif</Text>
                         </View>
                    </View>
                </View>

                {/* Bill / Balance */}
                <View style={styles.billContainer}>
                     <Text style={styles.currency}>Rp</Text>
                     <Text style={styles.billAmount}>350.000</Text>
                </View>
                <View style={styles.billDateContainer}>
                    <Text style={styles.billDate}>*Jatuh Tempo 8 Maret 2026</Text>
                </View>
                
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
      fontSize: 18,
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
      justifyContent: 'space-between',
      marginBottom: 10,
  },
  accountName: {
      fontSize: 16,
      color: '#3A3A3C',
      marginBottom: 4,
  },
  accountNumber: {
      fontSize: 14,
      color: '#8E8E93',
  },
  accountStatus: {
      justifyContent: 'center',
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
