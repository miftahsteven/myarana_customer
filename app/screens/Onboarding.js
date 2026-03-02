import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const Onboarding = ({ navigation }) => {
  const { login } = useAuth();

  const handleStart = async () => {
    try {
      const result = await AsyncStorage.getItem('userData');
      if (result) {
        // user is already logged in, set global context
        // this will trigger the root index.js to switch to AppStack (Dashboard)
        login(); 
      }
      // If no result, we just stay on Onboarding so the user can click "Ayo Mulai" -> Login
    } catch (error) {
      console.error(error);
    }
  };

  const handleButtonNext = async () => {
    try {
      const result = await AsyncStorage.getItem('userData');
      if (result) {
        // user is already logged in, set global context
        // this will trigger the root index.js to switch to AppStack (Dashboard)
        login(); 
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleStart();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/onboarding.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Selamat Datang di MyArana</Text>
            <Text style={styles.subtitle}>
              Manfaatkan layanan internet yang terbaik dengan MyArana. 
            </Text>

            <TouchableOpacity
              style={styles.button}
              //onPress={() => navigation.navigate('Login')}
              onPress={handleButtonNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Ayo Mulai</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 50,
  },
  content: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: width * 0.8,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4c669f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
});

export default Onboarding;
