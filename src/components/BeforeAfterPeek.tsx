import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { colors } from '../styles/shared';

interface BeforeAfterPeekProps {
  beforeUri: string;
  afterUri: string;
  aspectRatio?: number;
  borderRadius?: number;
  hint?: string;
  showHint?: boolean;
}

export default function BeforeAfterPeek({
  beforeUri,
  afterUri,
  aspectRatio = 4 / 5,
  borderRadius = 16,
  hint = 'Hold to peek original',
  showHint = true,
}: BeforeAfterPeekProps) {
  const [peeking, setPeeking] = useState(false);
  const [ready, setReady] = useState(false);
  const peekAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(peekAnim, {
        toValue: peeking ? 1 : 0,
        duration: peeking ? 180 : 280,
        useNativeDriver: true,
      }),
      Animated.timing(hintAnim, {
        toValue: peeking ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [peeking, peekAnim, hintAnim]);

  return (
    <Pressable
      onPressIn={() => setPeeking(true)}
      onPressOut={() => setPeeking(false)}
      style={[styles.wrap, { aspectRatio, borderRadius }]}
      onLayout={() => setReady(true)}
    >
      {ready && (
        <>
          <Image source={{ uri: afterUri }} style={styles.image} resizeMode="cover" />
          <Animated.Image
            source={{ uri: beforeUri }}
            style={[styles.image, styles.overlay, { opacity: peekAnim }]}
            resizeMode="cover"
          />
        </>
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{peeking ? 'Before' : 'After'}</Text>
      </View>

      {showHint && (
        <Animated.View style={[styles.hint, { opacity: hintAnim }]} pointerEvents="none">
          <Text style={styles.hintText}>{hint}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hint: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 2,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.45)',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
});
