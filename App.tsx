import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import { colors } from './src/styles/shared';

type Screen = 'home' | 'processing';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleAudioReady = (base64: string) => {
    setBase64Audio(base64);
    setCurrentScreen('processing');
  };

  const handleGoBack = () => {
    setBase64Audio(null);
    setCurrentScreen('home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background radial gradient simulation (shared) */}
      <View style={styles.radialBackground} />

      {currentScreen === 'home' && (
        <HomeScreen onAudioReady={handleAudioReady} showToast={showToast} />
      )}

      {currentScreen === 'processing' && base64Audio && (
        <ProcessingScreen base64Audio={base64Audio} onGoBack={handleGoBack} />
      )}

      {/* Global Toast */}
      {toastMessage !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  radialBackground: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: 600,
    height: 600,
    marginLeft: -300,
    marginTop: -300,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    padding: 12,
    backgroundColor: 'rgba(38, 38, 38, 0.95)',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 999,
  },
  toastText: {
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '500',
  },
});
