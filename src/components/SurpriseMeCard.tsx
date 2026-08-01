import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Effect } from '../types';
import { CardOrigin } from './ExpandCardOverlay';
import { colors } from '../styles/shared';

const GRADIENT = [
  '#ff6b6b',
  '#ffa94d',
  '#ffe066',
  '#69db7c',
  '#4dabf7',
  '#da77f2',
  '#ff6b6b',
] as const;

interface SurpriseMeCardProps {
  effect: Effect;
  onSelect: (effect: Effect, origin: CardOrigin) => void;
}

export default function SurpriseMeCard({ effect, onSelect }: SurpriseMeCardProps) {
  const cardRef = useRef<View>(null);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spin]);

  const handlePress = () => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      onSelect(effect, { x, y, width, height });
    });
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.press, pressed && styles.pressed]}
    >
      <View ref={cardRef} collapsable={false} style={styles.borderWrap}>
        <View style={styles.spinClip} pointerEvents="none">
          <Animated.View style={[styles.spinLayer, { transform: [{ rotate }] }]}>
            <LinearGradient
              colors={GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <LinearGradient
          colors={['#1a1220', '#121018', '#0c0c0c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          <LinearGradient
            colors={[
              'rgba(255,107,107,0.35)',
              'rgba(255,169,77,0.22)',
              'rgba(77,171,247,0.28)',
              'rgba(218,119,242,0.3)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.colorWash}
          />

          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.kicker}>Feeling lucky</Text>
              <Text style={styles.title}>Surprise me</Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Try</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    width: '100%',
    marginTop: 6,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  borderWrap: {
    borderRadius: 16,
    padding: 1.5,
    overflow: 'hidden',
  },
  spinClip: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinLayer: {
    width: 360,
    height: 360,
  },
  inner: {
    borderRadius: 14.5,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  copy: {
    flex: 1,
  },
  kicker: {
    color: 'rgba(245,245,245,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cta: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  ctaText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
  },
});
