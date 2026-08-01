import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Effect } from '../types';
import { colors } from '../styles/shared';

export type CardOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ExpandCardOverlayProps {
  effect: Effect;
  origin: CardOrigin;
  onFinished: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

/** Matches CaptureScreen preview layout: content pad 20, top bar ~56, aspect 4/5, radius 18 */
function getCapturePreviewTarget(safeTop: number) {
  const topBarHeight = 56;
  const contentPadTop = 8;
  const horizontalPad = 20;
  const width = SCREEN_W - horizontalPad * 2;
  const height = width / (4 / 5);
  return {
    x: horizontalPad,
    y: safeTop + topBarHeight + contentPadTop,
    width,
    height,
    radius: 18,
  };
}

export default function ExpandCardOverlay({
  effect,
  origin,
  onFinished,
}: ExpandCardOverlayProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const target = useMemo(() => getCapturePreviewTarget(insets.top), [insets.top]);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    fadeOut.setValue(1);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished || finishedRef.current) return;

      // Soft handoff: fade overlay away so Capture underneath takes over without a pop.
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished: faded }) => {
        if (faded && !finishedRef.current) {
          finishedRef.current = true;
          onFinished();
        }
      });
    });
  }, [backdrop, fadeOut, onFinished, progress]);

  const left = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.x, target.x],
  });
  const top = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.y, target.y],
  });
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.width, target.width],
  });
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.height, target.height],
  });
  const radius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, target.radius],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      <Animated.View
        style={[
          styles.card,
          {
            left,
            top,
            width,
            height,
            borderRadius: radius,
          },
        ]}
      >
        <Image source={effect.afterImage} style={styles.image} resizeMode="cover" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  card: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
