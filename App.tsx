import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import CreateEffectScreen from './src/screens/CreateEffectScreen';
import { Effect, Screen } from './src/types';
import { colors } from './src/styles/shared';

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2400);
  }, []);

  const goHome = () => setScreen({ name: 'home' });

  const handleSelectEffect = (effect: Effect) => {
    setScreen({ name: 'capture', effect });
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        {screen.name === 'home' && (
          <HomeScreen
            onSelectEffect={handleSelectEffect}
            onCreateEffect={() => setScreen({ name: 'create' })}
          />
        )}

        {screen.name === 'create' && (
          <CreateEffectScreen onBack={goHome} showToast={showToast} />
        )}

        {screen.name === 'capture' && (
          <CaptureScreen
            effect={screen.effect}
            onBack={goHome}
            showToast={showToast}
            onImageReady={({ uri, base64, mimeType }) =>
              setScreen({
                name: 'processing',
                effect: screen.effect,
                imageUri: uri,
                imageBase64: base64,
                mimeType,
              })
            }
          />
        )}

        {screen.name === 'processing' && (
          <ProcessingScreen
            effect={screen.effect}
            imageUri={screen.imageUri}
            imageBase64={screen.imageBase64}
            mimeType={screen.mimeType}
            onCancel={() => setScreen({ name: 'capture', effect: screen.effect })}
            onError={(message) => {
              showToast(message);
              setScreen({ name: 'capture', effect: screen.effect });
            }}
            onComplete={(result) =>
              setScreen({
                name: 'result',
                effect: screen.effect,
                originalUri: screen.imageUri,
                resultBase64: result.base64,
                resultMimeType: result.mimeType,
              })
            }
          />
        )}

        {screen.name === 'result' && (
          <ResultScreen
            effect={screen.effect}
            originalUri={screen.originalUri}
            resultBase64={screen.resultBase64}
            resultMimeType={screen.resultMimeType}
            onBackHome={goHome}
            onTryAgain={() => setScreen({ name: 'capture', effect: screen.effect })}
            showToast={showToast}
          />
        )}

        {toastMessage !== '' && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    zIndex: 999,
  },
  toastText: {
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
