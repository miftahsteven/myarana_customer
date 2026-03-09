import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const HistoryTransactions = () => {
  const navigation = useNavigation();

  // State Management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const LIMIT = 20;

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const fetchHistory = async (pageNumber = 1, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;
    
    if (pageNumber === 1) {
      if (!isRefresh) setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV'
        ? process.env.EXPO_PUBLIC_API_DEV_URL
        : process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${BASE_URL}/invoices/histories?limit=${LIMIT}&page=${pageNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      //console.log("JSON", json.data.results);
      
      
      // Sesuaikan pembacaan JSON berdasarkan format respons API Anda.
      // Asumsi format standar: { data: { results: [] } } atau list langsung
      let newTransactions = json.data?.results || json.data || json || [];
      
      // Pastikan newTransactions adalah sebuah array.
      // Apabila responsenya berbentuk Object (misalnya { "1": {..}, "2": {..} }), ubah menjadi array.
      if (!Array.isArray(newTransactions)) {
        if (typeof newTransactions === 'object' && newTransactions !== null) {
          newTransactions = Object.values(newTransactions);
        } else {
          newTransactions = [];
        }
      }

      if (pageNumber === 1) {
        setData(newTransactions);
      } else {
        setData(prev => [...prev, ...newTransactions]);
      }

      // Check if there's more data to fetch.
      // If the fetched items are less than the limit, we've reached the end.
      if (newTransactions.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pageNumber);
      }

    } catch (error) {
      console.error('Failed fetching history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchHistory(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchHistory(page + 1);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  const getStatusColor = (state) => {
    const s = String(state).toLowerCase();
    if (s.includes('sukses')) return '#34C759'; // Green
    if (s.includes('billed')) return '#007AFF'; // Blue
    if (s.includes('pending') || s.includes('waiting')) return '#FF9500'; // Orange
    if (s.includes('fail') || s.includes('cancel')) return '#FF3B30'; // Red
    return '#8E8E93'; // Default Gray
  };

  const getStatusLabel = (state) => {
    const s = String(state).toLowerCase();
    if (s.includes('sukses')) return 'Berhasil';
    if (s.includes('billed')) return 'Diterbitkan';
    if (s.includes('pending') || s.includes('waiting')) return 'Tertunda';
    if (s.includes('fail') || s.includes('cancel')) return 'Gagal';
    // Capitalize first letter as fallback
    if (!state) return 'Unknown';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  const renderItem = ({ item }) => {
    const date = item.created_at;
    const status = item.state;
    const desc = item.description || 'Transaksi';

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.transactionDate}>{formatDate(date)}</Text>
          <Text style={styles.transactionTitle} numberOfLines={2}>{desc}</Text>
          <View style={styles.statusRow}>
              <Ionicons 
                name={status === 'sukses' ? "checkmark-circle" : (status === 'billed' ? "document-text" : "close-circle")} 
                size={14} 
                color={getStatusColor(status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(status), marginLeft: 4 }]}>
                {getStatusLabel(status)}
              </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null; // Avoid flashing empty state while initial loading
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={80} color="#E5E5EA" />
        <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
        <Text style={styles.emptyDesc}>
          Anda belum memiliki riwayat pembayaran tagihan internet.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#673284ff" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.container}>
        {loading && page === 1 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#673284ff" />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
            renderItem={renderItem}
            contentContainerStyle={data.length === 0 ? styles.emptyListContent : styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#673284ff']}
                tintColor="#673284ff"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    ...Platform.select({
       ios: {
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.05,
         shadowRadius: 3,
       },
       android: {
         elevation: 3,
       }
    }),
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Standard light gray background for modern apps
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card Styles
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    // Modern shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  cardHeaderInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 20,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default HistoryTransactions;
