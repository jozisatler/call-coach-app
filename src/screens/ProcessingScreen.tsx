import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { applyEffectToImage } from '../services/api';
import { Effect } from '../types';
import { colors } from '../styles/shared';

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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function MorphLayer({
  uri,
  delay,
  size,
}: {
  uri: string;
  delay: number;
  size: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, progress]);

  const scaleX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.12, 0.94],
  });
  const scaleY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.9, 1.1],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '5deg'],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.7, 0.25],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 10],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, -8],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.morphLayer,
        {
          width: size,
          height: size,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scaleX },
            { scaleY },
            { rotate },
          ],
        },
      ]}
    >
      <Image source={{ uri }} style={styles.morphImage} blurRadius={1.5} />
    </Animated.View>
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
  const corePulse = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    pulseLoop.start();
    rippleLoop.start();
    shimmerLoop.start();
    return () => {
      pulseLoop.stop();
      rippleLoop.stop();
      shimmerLoop.stop();
    };
  }, [corePulse, ripple, shimmer]);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 2200);
    return () => clearInterval(id);
  }, [lines.length]);

  useEffect(() => {
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

  const coreScale = corePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.05],
  });
  const coreRotate = corePulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.45],
  });
  const rippleOpacity = ripple.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.45, 0.25, 0],
  });
  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 160],
  });

  const morphDelays = useMemo(() => [0, 350, 700], []);

  return (
    <View style={styles.root}>
      <Image source={{ uri: imageUri }} style={styles.bgImage} resizeMode="cover" />
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.stage}>
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          {morphDelays.map((delay) => (
            <MorphLayer key={delay} uri={imageUri} delay={delay} size={210} />
          ))}

          <Animated.View
            style={[
              styles.coreWrap,
              {
                transform: [{ scale: coreScale }, { rotate: coreRotate }],
              },
            ]}
          >
            <Image source={{ uri: imageUri }} style={styles.coreImage} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerX }, { rotate: '18deg' }],
                },
              ]}
            />
            <View style={styles.coreVignette} />
          </Animated.View>
        </View>

        <Text style={styles.kicker}>Morphing</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,8,0.42)',
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(232,228,220,0.45)',
  },
  morphLayer: {
    position: 'absolute',
    borderRadius: 42,
    overflow: 'hidden',
  },
  morphImage: {
    width: '100%',
    height: '100%',
  },
  coreWrap: {
    width: 168,
    height: 168,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(232,228,220,0.4)',
    backgroundColor: colors.surface,
  },
  coreImage: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 54,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  coreVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
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
    letterSpacing: -0.6,
  },
  status: {
    color: 'rgba(245,245,245,0.78)',
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginTop: 28,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  pct: {
    color: 'rgba(245,245,245,0.55)',
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
    color: 'rgba(245,245,245,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
});
