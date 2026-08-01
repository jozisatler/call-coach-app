import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import CreateEffectScreen from './src/screens/CreateEffectScreen';
import ScreenTransition from './src/components/ScreenTransition';
import ExpandCardOverlay, { CardOrigin } from './src/components/ExpandCardOverlay';
import { Effect, Screen } from './src/types';
import { colors } from './src/styles/shared';

function screenKey(screen: Screen) {
  if (screen.name === 'capture') return `capture:${screen.effect.id}`;
  if (screen.name === 'processing') return `processing:${screen.effect.id}`;
  if (screen.name === 'result') return `result:${screen.effect.id}`;
  return screen.name;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [toastMessage, setToastMessage] = useState('');
  const [expand, setExpand] = useState<{ effect: Effect; origin: CardOrigin } | null>(null);
  const [instantCapture, setInstantCapture] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(16)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastOpacity.setValue(0);
    toastY.setValue(14);
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(toastY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setToastMessage(''));
    }, 2400);
  }, [toastOpacity, toastY]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const goHome = () => {
    setInstantCapture(false);
    setExpand(null);
    setScreen({ name: 'home' });
  };

  const handleSelectEffect = useCallback((effect: Effect, origin: CardOrigin) => {
    // Mount capture under the overlay immediately — no fade — then expand on top.
    setInstantCapture(true);
    setScreen({ name: 'capture', effect });
    setExpand({ effect, origin });
  }, []);

  const handleExpandFinished = useCallback(() => {
    setExpand(null);
    setInstantCapture(false);
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        <ScreenTransition
          key={screenKey(screen)}
          screenKey={screenKey(screen)}
          screenName={screen.name}
          instant={instantCapture && screen.name === 'capture'}
        >
          {screen.name === 'home' && (
            <HomeScreen
              onSelectEffect={handleSelectEffect}
              onCreateEffect={() => setScreen({ name: 'create' })}
              onProfilePress={() => showToast('Profile coming soon')}
              onSearchPress={() => showToast('Search coming soon')}
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
              expanding={!!expand}
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
        </ScreenTransition>

        {expand && (
          <ExpandCardOverlay
            effect={expand.effect}
            origin={expand.origin}
            onFinished={handleExpandFinished}
          />
        )}

        {toastMessage !== '' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toast,
              {
                opacity: toastOpacity,
                transform: [{ translateY: toastY }],
              },
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
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
