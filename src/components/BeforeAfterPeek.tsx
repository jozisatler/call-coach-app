import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { colors } from '../styles/shared';

interface BeforeAfterPeekProps {
  beforeSource: ImageSourcePropType;
  afterSource: ImageSourcePropType;
  aspectRatio?: number;
  borderRadius?: number;
  hint?: string;
  showHint?: boolean;
}

export default function BeforeAfterPeek({
  beforeSource,
  afterSource,
  aspectRatio = 4 / 5,
  borderRadius = 16,
  hint = 'Hold to peek original',
  showHint = false,
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
          <Image source={afterSource} style={styles.image} resizeMode="cover" />
          <Animated.Image
            source={beforeSource}
            style={[styles.image, styles.overlay, { opacity: peekAnim }]}
            resizeMode="cover"
          />
        </>
      )}

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
