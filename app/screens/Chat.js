import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
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
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

const { width } = Dimensions.get('window');

// Helper untuk fix parsing tanggal string di Javascript Engine React Native (terutama iOS)
const parseDate = (d) => {
  if (!d) return new Date(0);
  if (typeof d === 'string') {
    // Pastikan format "2026-03-05 17:10:00" menjadi "2026-03-05T17:10:00" agar valid di JS
    return new Date(d.replace(' ', 'T'));
  }
  return new Date(d);
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [idUser, setIdUser] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef(null);

  // Load user ID from SecureStore
  useEffect(() => {
    const loadUser = async () => {
      const raw = await SecureStore.getItemAsync('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        setIdUser(parsed.userLoggedIn.id);
      }
    };
    loadUser();
  }, []);

  // Subscribe to Firebase chat history
  useEffect(() => {
    if (!idUser) return;
    const chatRef = ref(db, `customers/${COMPANY_ID}/${MODE}/user_profile/${idUser}/chats`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase may store as object with keys, convert to sorted array
        const list = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        // Sort Descending: Urutkan dari index terbesar ke terkecil
        // Karena `inverted={true}`, item Index 0 dari 'list' ini (yakni Index Terbesar Firebase) 
        // akan dirender di BAWAH dekat input. Dan Index Kecil Firebase akan diletakkan di ATAS.
        list.sort((a, b) => {
          const numA = Number(a.id);
          const numB = Number(b.id);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numB - numA;
          }
          return String(b.id).localeCompare(String(a.id));
        });
        setMessages(list);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [idUser]);

  // Auto-scroll to bottom (newest message) when messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  // Listen to keyboard to adjust bottom padding dynamically
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV'
        ? process.env.EXPO_PUBLIC_API_DEV_URL
        : process.env.EXPO_PUBLIC_API_URL;

      await fetch(`${BASE_URL}/bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });
      // Firebase listener will pick up the new messages automatically
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const API_CONFIG = process.env.EXPO_PUBLIC_API_CONFIG;
      const BASE_URL = API_CONFIG === 'DEV'
        ? process.env.EXPO_PUBLIC_API_DEV_URL
        : process.env.EXPO_PUBLIC_API_URL;

      const closing = await fetch(`${BASE_URL}/bots/close`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
//      console.log("closing", closing);
      
      setMenuVisible(false); // Tutup menu setelah diklik
      // Optional: navigation.goBack() jika setelah tutup otomatis kembali
    } catch (err) {
      console.error('Failed to close conversation:', err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatMessage = (text, baseStyle, colorStyle) => {
    if (!text) return null;
    
    // First, convert literal '\n' string characters into actual newlines, in case the API returned them raw
    const normalizedText = text.replace(/\\n/g, '\n');
    let lines = normalizedText.split('\n');
    
    // Clean up empty lines at the end
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const matchList = line.match(/^(\d+\.|-)\s+(.*)/);

      if (matchList) {
        // It's a list item
        const bullet = matchList[1];
        const titleLine = matchList[2];
        
        let contentLines = [titleLine];
        i++;
        
        // Grab following lines that belong to this list item (e.g. descriptions not starting with a number)
        while (i < lines.length) {
          const nextLine = lines[i];
          const isNextList = nextLine.match(/^(\d+\.|-)\s+(.*)/);
          if (isNextList || nextLine.trim() === '') {
             break; // Stop when next list item starts or paragraph breaks
          }
          contentLines.push(nextLine);
          i++;
        }

        result.push(
          <View key={`list-item-${i}`} style={styles.listItem}>
            <Text style={[baseStyle, colorStyle, styles.listBullet]}>{bullet}</Text>
            <View style={styles.listContent}>
              {contentLines.map((cLine, idx) => (
                <Text key={`line-${i}-${idx}`} style={[baseStyle, colorStyle, { marginBottom: idx < contentLines.length - 1 ? 4 : 0 }]}>
                  {cLine}
                </Text>
              ))}
            </View>
          </View>
        );

      } else {
         // Normal paragraph
         if (line.trim().length > 0) {
           result.push(
             <Text key={`text-${i}`} style={[baseStyle, colorStyle, { marginBottom: 6 }]}>
               {line}
             </Text>
           );
         }
         i++;
      }
    }

    return <View>{result}</View>;
  };

  const renderMessage = ({ item, index }) => {
    const isBot = item.name === 'Arana';
    const isUser = !isBot;

    // Because inverted={true}, index 0 is newest at the bottom.
    // We show a date separator if it's the oldest message (index === messages.length - 1)
    // or if the *next* older message (index + 1) is from a different day.
    const showDate =
      index === messages.length - 1 ||
      parseDate(item.time).toDateString() !==
        parseDate(messages[index + 1]?.time).toDateString();
        //console.log(item.message);
        

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {parseDate(item.time).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        {/* User = kanan (ungu), Bot = kiri (putih) — standar WhatsApp */}
        <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowBot]}>
          {isBot && (
            <View style={styles.botAvatar}>
              {/* <Ionicons name="hardware-chip-outline" size={16} color="#fff" /> */}
              <Image source={require('../../assets/agent_foto.png')} 
              style={{ width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' }} />
            </View>
          )}
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            {isBot && (
              <Text style={styles.bubbleSenderName}>{item.name}</Text>
            )}
            <View>
              {formatChatMessage(item.message || '', styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot)}
            </View>
            <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeBot]}>
              {item.time ? parseDate(item.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
              {isUser && (
                <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
              )}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="chatbubbles-outline" size={52} color="#673284ff" />
      </View>
      {/* <Text style={styles.emptyTitle}>Halo! Apa yang bisa kami bantu?</Text>
      <Text style={styles.emptySubtitle}>Kirim pesan dan kami akan segera merespons.</Text> */}
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#673284ff', '#1b060aff']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerAvatar}>
          {/* <Ionicons name="hardware-chip-outline" size={20} color="#fff" /> */}
          <Image source={require('../../assets/agent_foto.png')} 
          style={{ width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' }} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Arana Support</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Dropdown Menu Header */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleCloseConversation}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
              <Text style={styles.menuItemTextDanger}>Tutup Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted={true}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          ListEmptyComponent={
            // ScaleY(-1) to fix inverted empty state
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <EmptyState />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={[
          styles.inputBar,
          isKeyboardVisible && { paddingBottom: 10 }
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ketik pesan..."
              placeholderTextColor="#A0A0A8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F8',    
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? 46 : 14,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  headerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 5,
  },
  onlineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  // Dropdown Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle dark overlay tipis
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 65, // Sesuaikan tinggi dropdown muncul di bawah header
    right: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 5,
    width: 170,
    // Native shadow yang keren & elegan
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemTextDanger: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 10,
  },

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E6',
  },
  dateText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: '#9E9EA8',
    fontWeight: '600',
  },

  // Message rows & bubbles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowBot:  { justifyContent: 'flex-start' },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#673284ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: width * 0.72,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#673284ff',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot:  { color: '#1C1C1E' },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#673284ff',
    marginBottom: 4,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
  bubbleTimeBot: {
    color: '#9E9EA8',
    textAlign: 'left',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(103,50,132,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 19,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    // Default padding untuk memunculkan background putih di balik floating tab bar
    paddingBottom: Platform.OS === 'ios' ? 90 : 120,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EBEBF0',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F4F4F8',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
    maxHeight: 130,
    marginRight: 10,
  },
  textInput: {
    fontSize: 15,
    color: '#1C1C1E',
    padding: 0,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#673284ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#673284ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#C3ADC9',
    shadowOpacity: 0,
    elevation: 0,
  },
  listContainer: {
    marginVertical: 4,
    marginLeft: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listBullet: {
    width: 20,
    fontWeight: '600',
  },
  listContent: {
    flex: 1,
  },
});

export default Chat;
