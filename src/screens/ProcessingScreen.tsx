import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyEffectToImage } from '../services/api';
import { Effect } from '../types';
import { colors, sharedStyles } from '../styles/shared';

interface ProcessingScreenProps {
  effect: Effect;
  imageUri: string;
  imageBase64: string;
  mimeType: string;
  onComplete: (result: { base64: string; mimeType: string }) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

const STAGE_LINES: Record<string, string[]> = {
  'aura-glow': [
    'Finding the main subject…',
    'Igniting the neon rim…',
    'Blooming soft light particles…',
    'Balancing the glow…',
    'Almost radiant…',
  ],
  'plush-subject': [
    'Spotting the main subject…',
    'Spinning soft fabric threads…',
    'Stitching plush seams…',
    'Fluffing the texture…',
    'Making it huggable…',
  ],
  'polaroid-flash': [
    'Framing the instant print…',
    'Firing the disposable flash…',
    'Warming the faded tones…',
    'Adding soft film grain…',
    'Sealing the Polaroid border…',
  ],
  'double-exposure': [
    'Tracing the silhouette…',
    'Layering the second exposure…',
    'Blending sky into form…',
    'Balancing the overlap…',
    'Finishing the film look…',
  ],
  'voxel-subject': [
    'Locking onto the main subject…',
    'Cubing the silhouette…',
    'Stacking voxel layers…',
    'Keeping the scene untouched…',
    'Crisping the block forms…',
  ],
  'film-noir': [
    'Crushing the shadows…',
    'Bleaching the highlights…',
    'Laying film grain…',
    'Carving the rim light…',
    'Locking the noir mood…',
  ],
  default: [
    'Reading your photo…',
    'Finding the main subject…',
    'Cooking the effect…',
    'Refining the details…',
    'Almost there…',
  ],
};

function Ring({
  size,
  delay,
  color,
}: {
  size: number;
  delay: number;
  color: string;
}) {
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.55,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(scale, {
          toValue: 0.55,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export default function ProcessingScreen({
  effect,
  imageUri,
  imageBase64,
  mimeType,
  onComplete,
  onError,
  onCancel,
}: ProcessingScreenProps) {
  const lines = STAGE_LINES[effect.id] || STAGE_LINES.default;
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(0.06);
  const cancelled = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const spin = useRef(new Animated.Value(0)).current;
  const previewPulse = useRef(new Animated.Value(0.92)).current;

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const spinStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: spin.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ],
    }),
    [spin]
  );

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(previewPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(previewPulse, {
          toValue: 0.92,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [previewPulse, spin]);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 2200);
    return () => clearInterval(id);
  }, [lines.length]);

  useEffect(() => {
    // Satisfying fake progress that eases toward ~90% while waiting
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.9) return p;
        return p + (0.9 - p) * 0.045;
      });
    }, 180);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    cancelled.current = false;

    (async () => {
      try {
        const result = await applyEffectToImage(
          imageBase64,
          mimeType,
          effect.name,
          effect.prompt,
          () => undefined
        );
        if (cancelled.current) return;
        setProgress(1);
        setTimeout(() => {
          if (!cancelled.current) onCompleteRef.current(result);
        }, 280);
      } catch (error: any) {
        if (!cancelled.current) onErrorRef.current(error?.message || 'Failed to apply effect');
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [effect.name, effect.prompt, imageBase64, mimeType]);

  const pct = Math.round(progress * 100);

  return (
    <SafeAreaView style={[sharedStyles.safeArea, styles.screen]} edges={['top', 'bottom']}>
      <View style={styles.stage}>
        <Ring size={220} delay={0} color="rgba(232,228,220,0.35)" />
        <Ring size={280} delay={450} color="rgba(232,228,220,0.22)" />
        <Ring size={340} delay={900} color="rgba(232,228,220,0.12)" />

        <Animated.View style={[styles.orbit, spinStyle]}>
          <View style={styles.orbitDot} />
        </Animated.View>

        <Animated.View style={[styles.previewWrap, { transform: [{ scale: previewPulse }] }]}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={styles.previewVignette} />
        </Animated.View>
      </View>

      <Text style={styles.kicker}>Brewing effect</Text>
      <Text style={styles.title}>{effect.name}</Text>
      <Text style={styles.status}>{lines[lineIndex]}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(pct, 4)}%` }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>

      <Pressable
        onPress={() => {
          cancelled.current = true;
          onCancel();
        }}
        style={styles.cancel}
        hitSlop={10}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stage: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  orbit: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  orbitDot: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  previewWrap: {
    width: 132,
    height: 132,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(232,228,220,0.35)',
    backgroundColor: colors.surface,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  kicker: {
    color: colors.textSubtle,
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
    letterSpacing: -0.6,
  },
  status: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
    minHeight: 22,
  },
  barTrack: {
    width: '100%',
    maxWidth: 280,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfacePressed,
    marginTop: 28,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  pct: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  cancel: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '600',
  },
});
