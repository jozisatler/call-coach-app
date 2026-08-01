import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { RotateCcw, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Effect } from '../types';
import BeforeAfterPeek from '../components/BeforeAfterPeek';
import { colors } from '../styles/shared';

interface ResultScreenProps {
  effect: Effect;
  originalUri: string;
  resultBase64: string;
  resultMimeType: string;
  onBackHome: () => void;
  onTryAgain: () => void;
  showToast: (msg: string) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = Math.min(SCREEN_W - 48, 320);
const HERO_H = Math.round(HERO_W * (4 / 3));
const SHAKE_DELTA = 1.2;
const SHAKE_GAIN = 0.32;
const TAP_GAIN = 0.4;

function extensionForMime(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

async function writeResultFile(resultBase64: string, resultMimeType: string) {
  const ext = extensionForMime(resultMimeType);
  const fileUri = `${FileSystem.cacheDirectory}story-snap-${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, resultBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { fileUri, ext, mimeType: resultMimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` };
}

export default function ResultScreen({
  effect,
  originalUri,
  resultBase64,
  resultMimeType,
  onBackHome,
  onTryAgain,
  showToast,
}: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const resultUri = `data:${resultMimeType};base64,${resultBase64}`;

  const unlockedRef = useRef(false);
  const progressRef = useRef(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const lastHitAt = useRef(0);

  const punch = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;

  const runUnlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    progressRef.current = 1;
    setUnlocked(true);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(flash, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(punch, {
          toValue: 1.12,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(punch, {
          toValue: 1,
          friction: 5,
          tension: 130,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [flash, punch]);

  const bumpProgress = useCallback(
    (amount: number) => {
      if (unlockedRef.current) return;

      const next = Math.min(1, progressRef.current + amount);
      progressRef.current = next;

      Animated.sequence([
        Animated.timing(punch, {
          toValue: 1.05 + amount * 0.1,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.spring(punch, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (next >= 1) runUnlock();
    },
    [punch, runUnlock]
  );

  useEffect(() => {
    unlockedRef.current = false;
    progressRef.current = 0;
    setUnlocked(false);
    punch.setValue(1);
    flash.setValue(0);
  }, [punch, flash, resultBase64]);

  useEffect(() => {
    if (unlocked) return;

    const wobbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 110,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 110,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(480),
      ])
    );
    const hintLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    wobbleLoop.start();
    hintLoop.start();
    return () => {
      wobbleLoop.stop();
      hintLoop.stop();
    };
  }, [hintPulse, unlocked, wobble]);

  useEffect(() => {
    if (unlocked) return;

    let sub: { remove: () => void } | null = null;
    let active = true;

    (async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available || !active) return;

      Accelerometer.setUpdateInterval(40);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const prev = lastAccel.current;
        const delta = Math.abs(x - prev.x) + Math.abs(y - prev.y) + Math.abs(z - prev.z);
        lastAccel.current = { x, y, z };

        const now = Date.now();
        if (delta > SHAKE_DELTA && now - lastHitAt.current > 70) {
          lastHitAt.current = now;
          const strength = Math.min(0.48, (delta - SHAKE_DELTA) * 0.15 + SHAKE_GAIN);
          bumpProgress(strength);
        }
      });
    })();

    return () => {
      active = false;
      sub?.remove();
    };
  }, [bumpProgress, unlocked]);

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        showToast('Photo library permission is required to save');
        return;
      }
      const { fileUri } = await writeResultFile(resultBase64, resultMimeType);
      await MediaLibrary.saveToLibraryAsync(fileUri);
      showToast('Saved to your photos');
    } catch (error: any) {
      console.log('[Story Snap] save failed:', error?.message || error);
      showToast(error?.message || 'Could not save photo');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    try {
      setSharing(true);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast('Sharing is not available on this device');
        return;
      }
      const { fileUri, mimeType } = await writeResultFile(resultBase64, resultMimeType);
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Share your effect',
        UTI: 'public.image',
      });
    } catch (error: any) {
      console.log('[Story Snap] share failed:', error?.message || error);
      showToast(error?.message || 'Could not open share sheet');
    } finally {
      setSharing(false);
    }
  };

  const wobbleRotate = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });
  const wobbleX = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 6],
  });
  const hintOpacity = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });
  const hintScale = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.04],
  });

  return (
    <View style={styles.root}>
      {/* Locked: solid dark. Unlocked: result as soft backdrop */}
      {unlocked ? (
        <>
          <Image source={{ uri: resultUri }} style={styles.bgImage} resizeMode="cover" />
          <View style={styles.bgDim} />
        </>
      ) : (
        <View style={styles.bgLocked} />
      )}

      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.kicker}>{unlocked ? 'Ready' : 'Shake to reveal'}</Text>
          <Text style={styles.title}>{effect.name}</Text>

          <Animated.View
            style={[
              styles.heroWrap,
              {
                height: HERO_H,
                transform: unlocked
                  ? [{ scale: punch }]
                  : [{ translateX: wobbleX }, { rotate: wobbleRotate }, { scale: punch }],
              },
            ]}
          >
            {unlocked ? (
              <BeforeAfterPeek
                beforeSource={{ uri: originalUri }}
                afterSource={{ uri: resultUri }}
                aspectRatio={3 / 4}
                borderRadius={24}
                showHint
                hint="Hold to peek original"
              />
            ) : (
              <Pressable
                onPress={() => bumpProgress(TAP_GAIN)}
                style={styles.sealedCard}
              >
                <View style={styles.sealSurface} />
                <View style={styles.sealGrain} />

                <Animated.View
                  style={[
                    styles.shakeHint,
                    { opacity: hintOpacity, transform: [{ scale: hintScale }] },
                  ]}
                >
                  <Text style={styles.shakeTitle}>Shake to reveal</Text>
                  <Text style={styles.shakeSub}>or tap to charge</Text>
                </Animated.View>
              </Pressable>
            )}
          </Animated.View>

          {unlocked && (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  sharing && styles.disabled,
                ]}
                onPress={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Share2 size={16} color={colors.bg} />
                )}
                <Text style={styles.primaryText}>{sharing ? 'Opening…' : 'Share'}</Text>
              </Pressable>

              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.pressed,
                    saving && styles.disabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Download size={16} color={colors.text} />
                  )}
                  <Text style={styles.secondaryText}>{saving ? 'Saving…' : 'Save'}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={onTryAgain}
                >
                  <RotateCcw size={16} color={colors.text} />
                  <Text style={styles.secondaryText}>Retry</Text>
                </Pressable>
              </View>

              <Pressable onPress={onBackHome} style={styles.ghost} hitSlop={10}>
                <Text style={styles.ghostText}>Back to library</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgLocked: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,8,0.72)',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
  },
  kicker: {
    color: 'rgba(245,245,245,0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.7,
    marginBottom: 22,
  },
  heroWrap: {
    width: HERO_W,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  sealedCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,228,220,0.22)',
    backgroundColor: '#141414',
  },
  sealSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141414',
  },
  sealGrain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232,228,220,0.04)',
  },
  shakeHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  shakeTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  shakeSub: {
    color: 'rgba(245,245,245,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
  },
  primaryText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  ghost: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ghostText: {
    color: 'rgba(245,245,245,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
