import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const SnapPayment = ({ navigation, route }) => {
  const { url } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        {/* Spacer for centering title */}
        <View style={{ width: 40 }} />
      </View>

      <WebView
        source={{ uri: url }}
        scalesPageToFit={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        scrollEnabled={true}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTop: { 
    flexDirection: 'row', 
    width: '100%', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 10, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    zIndex: 10 
  },
  backButton: { 
    padding: 8, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    shadowOffset: { width: 0, height: 1 } 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1C1C1E' 
  },
});

export default SnapPayment;
